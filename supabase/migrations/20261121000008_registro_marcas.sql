-- =============================================================
-- 0008 · Registro privado de marcas
--   Alianzas genera un link personal por marca (/registro/:token). La marca completa
--   sus datos, logo y productos sin estar logueada. El link no figura en la web.
-- =============================================================

alter table public.marcas add column if not exists registro_token text unique;
alter table public.marcas add column if not exists registro_abierto boolean not null default false;
alter table public.marcas add column if not exists registro_completado_at timestamptz;
alter table public.marcas add column if not exists registro_extra jsonb not null default '{}'::jsonb;
-- (anon no tiene permiso sobre estas columnas: el grant público de marcas es por columna)

-- Carpeta de archivos de la marca: hash del token (así la URL pública de una foto no revela el link).
create or replace function public.registro_hash(p_token text)
returns text language sql immutable set search_path = '' as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.registro_hash_valido(p_hash text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.marcas
                 where registro_abierto and registro_token is not null
                   and public.registro_hash(registro_token) = p_hash);
$$;

-- Panel (Alianzas): generar / cerrar el link
create or replace function public.registro_generar(p_marca_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  if not public.tiene_rol('alianzas') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  update public.marcas set registro_token = coalesce(registro_token, public.gen_token()), registro_abierto = true
  where id = p_marca_id returning registro_token into v;
  if v is null then raise exception 'Marca inexistente.' using errcode = 'P0001'; end if;
  return v;
end; $$;

create or replace function public.registro_cerrar(p_marca_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.tiene_rol('alianzas') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  update public.marcas set registro_abierto = false where id = p_marca_id;
  return jsonb_build_object('ok', true);
end; $$;

-- Público con el link: ver lo cargado
create or replace function public.registro_ver(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'nombre', m.nombre, 'rubro', m.rubro, 'descripcion', m.descripcion, 'instagram', m.instagram,
    'whatsapp', m.whatsapp, 'web', m.web, 'logo_path', m.logo_path,
    'extra', m.registro_extra, 'completado_at', m.registro_completado_at,
    'carpeta', 'registro/' || public.registro_hash(m.registro_token),
    'productos', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'nombre', p.nombre, 'descripcion', p.descripcion, 'precio', p.precio, 'foto_path', p.foto_path,
        'disp_previa', p.disp_previa, 'disp_festival', p.disp_festival, 'disp_post', p.disp_post) order by p.orden, p.nombre)
      from public.productos p where p.marca_id = m.id), '[]'::jsonb)
  )
  from public.marcas m
  where m.registro_token = p_token and m.registro_abierto;
$$;

-- Público con el link: guardar
create or replace function public.registro_guardar(p_token text, p_datos jsonb, p_productos jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_marca public.marcas;
  v_carpeta text;
  v_logo text;
  v_p jsonb;
  v_ids uuid[] := '{}';
  v_id uuid;
  v_foto text;
  v_orden int := 0;
  t text;
begin
  select * into v_marca from public.marcas where registro_token = p_token and registro_abierto for update;
  if not found then
    raise exception 'Este link de registro no es válido o ya fue cerrado. Escribile a Vanesa.' using errcode = 'P0001';
  end if;
  v_carpeta := 'registro/' || public.registro_hash(p_token) || '/';

  if length(trim(coalesce(p_datos->>'nombre', ''))) < 2 then
    raise exception 'Falta el nombre de la marca.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_datos->>'contacto_nombre', ''))) < 2 or length(regexp_replace(coalesce(p_datos->>'contacto_whatsapp', ''), '\D', '', 'g')) < 8 then
    raise exception 'Completá el nombre y el WhatsApp de la persona de contacto.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_productos, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_productos, '[]'::jsonb)) > 30 then
    raise exception 'Máximo 30 productos.' using errcode = 'P0001';
  end if;

  v_logo := nullif(p_datos->>'logo_path', '');
  if v_logo is not null and v_logo is distinct from v_marca.logo_path and left(v_logo, length(v_carpeta)) <> v_carpeta then
    raise exception 'Logo no válido.' using errcode = 'P0001';
  end if;

  update public.marcas set
    nombre = left(trim(p_datos->>'nombre'), 120),
    rubro = left(nullif(trim(coalesce(p_datos->>'rubro', '')), ''), 80),
    descripcion = left(nullif(trim(coalesce(p_datos->>'descripcion', '')), ''), 2000),
    instagram = public.limpiar_ig(p_datos->>'instagram'),
    whatsapp = left(nullif(trim(coalesce(p_datos->>'whatsapp', '')), ''), 40),
    web = left(nullif(trim(coalesce(p_datos->>'web', '')), ''), 200),
    logo_path = coalesce(v_logo, logo_path),
    contacto_interno = left(concat_ws(' · ', nullif(trim(p_datos->>'contacto_nombre'), ''),
                                       nullif(trim(p_datos->>'contacto_whatsapp'), ''),
                                       nullif(trim(coalesce(p_datos->>'contacto_email', '')), '')), 500),
    registro_extra = jsonb_strip_nulls(jsonb_build_object(
      'contacto_nombre', left(trim(p_datos->>'contacto_nombre'), 120),
      'contacto_whatsapp', left(trim(p_datos->>'contacto_whatsapp'), 40),
      'contacto_email', left(nullif(trim(coalesce(p_datos->>'contacto_email', '')), ''), 120),
      'canje_oferta', left(nullif(trim(coalesce(p_datos->>'canje_oferta', '')), ''), 1000),
      'medios_pago', left(nullif(trim(coalesce(p_datos->>'medios_pago', '')), ''), 300),
      'necesidades', left(nullif(trim(coalesce(p_datos->>'necesidades', '')), ''), 1000),
      'comentarios', left(nullif(trim(coalesce(p_datos->>'comentarios', '')), ''), 2000)))
  where id = v_marca.id;

  for v_p in select * from jsonb_array_elements(coalesce(p_productos, '[]'::jsonb)) loop
    t := trim(coalesce(v_p->>'nombre', ''));
    if t = '' then continue; end if;
    v_orden := v_orden + 1;
    v_foto := nullif(v_p->>'foto_path', '');
    v_id := nullif(v_p->>'id', '')::uuid;
    if v_id is not null and not exists (select 1 from public.productos where id = v_id and marca_id = v_marca.id) then
      v_id := null;
    end if;
    if v_foto is not null and left(v_foto, length(v_carpeta)) <> v_carpeta
       and not exists (select 1 from public.productos where id = v_id and foto_path = v_foto) then
      raise exception 'Foto de producto no válida.' using errcode = 'P0001';
    end if;

    if v_id is null then
      insert into public.productos (marca_id, nombre, descripcion, precio, foto_path, disp_previa, disp_festival, disp_post, orden)
      values (v_marca.id, left(t, 120), left(nullif(trim(coalesce(v_p->>'descripcion', '')), ''), 1000),
              nullif(v_p->>'precio', '')::numeric::int, v_foto,
              coalesce((v_p->>'disp_previa')::boolean, true), coalesce((v_p->>'disp_festival')::boolean, true),
              coalesce((v_p->>'disp_post')::boolean, true), v_orden)
      returning id into v_id;
    else
      update public.productos set nombre = left(t, 120),
        descripcion = left(nullif(trim(coalesce(v_p->>'descripcion', '')), ''), 1000),
        precio = nullif(v_p->>'precio', '')::numeric::int, foto_path = v_foto,
        disp_previa = coalesce((v_p->>'disp_previa')::boolean, true),
        disp_festival = coalesce((v_p->>'disp_festival')::boolean, true),
        disp_post = coalesce((v_p->>'disp_post')::boolean, true), orden = v_orden
      where id = v_id;
    end if;
    v_ids := v_ids || v_id;
  end loop;

  -- Productos que la marca sacó de la lista (y que no forman parte de una bolsa)
  delete from public.productos p
  where p.marca_id = v_marca.id and not (p.id = any (v_ids))
    and not exists (select 1 from public.bolsa_items_base b where b.producto_id = p.id);

  -- Al final, para que el aviso por mail ya vea los productos actualizados.
  update public.marcas set registro_completado_at = now() where id = v_marca.id;

  return jsonb_build_object('ok', true);
end; $$;

-- Archivos subidos desde el link (logo y fotos de productos)
create policy registro_subir on storage.objects for insert to anon, authenticated
  with check (
    bucket_id in ('marcas', 'productos')
    and (storage.foldername(name))[1] = 'registro'
    and public.registro_hash_valido((storage.foldername(name))[2])
  );

grant execute on function public.registro_hash_valido(text) to anon, authenticated;
grant execute on function public.registro_ver(text) to anon, authenticated;
grant execute on function public.registro_guardar(text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.registro_generar(uuid) to authenticated;
grant execute on function public.registro_cerrar(uuid) to authenticated;
