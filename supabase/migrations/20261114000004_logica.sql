-- =============================================================
-- 0004 · Lógica de negocio en el servidor (sección 2.5 del brief)
--   Todas las funciones son security definer con search_path vacío.
--   Al final se revocan todos los permisos y se otorgan uno por uno.
-- =============================================================

-- ---------- Helpers internos ----------
create or replace function public.cfg(p_clave text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((select valor from public.config where clave = p_clave), '{}'::jsonb);
$$;

create or replace function public.slugify(t text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(
    translate(lower(coalesce(t, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- ¿El pedido ocupa cupo? (pagado, o pendiente/comprobante enviado y no vencido)
create or replace function public.pedido_ocupa_cupo(p_estado public.pedido_estado, p_vence timestamptz)
returns boolean language sql stable set search_path = '' as $$
  select p_estado = 'pagado'
      or p_estado = 'comprobante_enviado'
      or (p_estado = 'pendiente' and (p_vence is null or p_vence > now()));
$$;

create or replace function public.ocupadas_tipo(p_tipo uuid)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::int
  from public.entradas e
  join public.pedidos p on p.id = e.pedido_id
  where e.tipo_entrada_id = p_tipo
    and public.pedido_ocupa_cupo(p.estado, p.vence_at);
$$;

-- Marca como vencidos los pedidos pendientes cuyo plazo pasó (también lo corre un cron).
create or replace function public.vencer_pedidos()
returns integer language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.pedidos set estado = 'vencido'
  where estado = 'pendiente' and vence_at is not null and vence_at <= now();
  get diagnostics n = row_count;
  return n;
end; $$;

-- =============================================================
-- PÚBLICO
-- =============================================================

-- Tipos de entrada con lugares restantes
create or replace function public.tipos_entrada_disponibles()
returns table (
  id uuid, nombre text, descripcion text, precio int, cupo int, restantes int,
  incluye_almuerzo boolean, incluye_festival boolean, valor_canje int, orden int
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.nombre, t.descripcion, t.precio, t.cupo,
         case when t.cupo is null then null else greatest(t.cupo - public.ocupadas_tipo(t.id), 0) end,
         t.incluye_almuerzo, t.incluye_festival, t.valor_canje, t.orden
  from public.tipos_entrada t
  where t.activo and t.venta_online
  order by t.orden;
$$;

-- Crear pedido de entradas.
-- p_items: [{"tipo_entrada_id": uuid, "cantidad": n, "titulares": ["Ana", "Juli"]}]
create or replace function public.crear_pedido_entradas(
  p_nombre text, p_email text, p_whatsapp text, p_metodo public.metodo_pago, p_items jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido public.pedidos;
  v_item jsonb;
  v_tipo public.tipos_entrada;
  v_cant int;
  v_total int := 0;
  v_cant_total int := 0;
  v_titulares jsonb;
  v_titular text;
  i int;
begin
  if coalesce((public.cfg('ventas')->>'entradas_abiertas')::boolean, true) is not true then
    raise exception 'La venta de entradas está cerrada por ahora.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Falta tu nombre.' using errcode = 'P0001';
  end if;
  if length(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')) < 8 then
    raise exception 'Revisá tu número de WhatsApp.' using errcode = 'P0001';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Elegí al menos una entrada.' using errcode = 'P0001';
  end if;

  insert into public.pedidos (tipo, nombre, email, whatsapp, total, metodo_pago, canal, estado, vence_at)
  values ('entrada', trim(p_nombre), nullif(trim(coalesce(p_email, '')), ''), trim(p_whatsapp), 0,
          p_metodo, 'online', 'pendiente', now() + interval '48 hours')
  returning * into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cant := coalesce((v_item->>'cantidad')::int, 0);
    if v_cant <= 0 then continue; end if;

    -- Bloqueo de fila: serializa la verificación de cupo entre compras simultáneas.
    select * into v_tipo from public.tipos_entrada
      where id = (v_item->>'tipo_entrada_id')::uuid and activo and venta_online
      for update;
    if not found then
      raise exception 'Ese tipo de entrada no está disponible.' using errcode = 'P0001';
    end if;

    if v_tipo.cupo is not null and public.ocupadas_tipo(v_tipo.id) + v_cant > v_tipo.cupo then
      raise exception 'No quedan suficientes lugares para "%". Quedan %.',
        v_tipo.nombre, greatest(v_tipo.cupo - public.ocupadas_tipo(v_tipo.id), 0) using errcode = 'P0001';
    end if;

    insert into public.pedido_items (pedido_id, item_tipo, item_id, nombre, cantidad, precio_unit)
    values (v_pedido.id, 'tipo_entrada', v_tipo.id, v_tipo.nombre, v_cant, v_tipo.precio);

    v_titulares := coalesce(v_item->'titulares', '[]'::jsonb);
    for i in 0..(v_cant - 1) loop
      v_titular := nullif(trim(coalesce(v_titulares->>i, '')), '');
      insert into public.entradas (pedido_id, tipo_entrada_id, titular_nombre)
      values (v_pedido.id, v_tipo.id, coalesce(v_titular, trim(p_nombre)));
    end loop;

    v_total := v_total + v_cant * v_tipo.precio;
    v_cant_total := v_cant_total + v_cant;
  end loop;

  if v_cant_total = 0 then
    raise exception 'Elegí al menos una entrada.' using errcode = 'P0001';
  end if;
  if v_cant_total > 10 then
    raise exception 'Máximo 10 entradas por pedido.' using errcode = 'P0001';
  end if;

  update public.pedidos set total = v_total where id = v_pedido.id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'token', v_pedido.token,
                            'total', v_total, 'vence_at', v_pedido.vence_at);
end; $$;

-- Crear pedido de bolsa. El total SIEMPRE se calcula acá.
-- p_extras: [{"producto_id": uuid, "cantidad": n}]
create or replace function public.crear_pedido_bolsa(
  p_nombre text, p_email text, p_whatsapp text, p_metodo public.metodo_pago,
  p_bolsa_id uuid, p_cantidad int, p_extras jsonb,
  p_es_regalo boolean, p_regalo_para text, p_regalo_mensaje text, p_entrega public.entrega_tipo
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido public.pedidos;
  v_bolsa public.bolsas;
  v_prod record;
  v_extra jsonb;
  v_cant int;
  v_total int := 0;
begin
  if coalesce((public.cfg('ventas')->>'bolsas_abiertas')::boolean, true) is not true then
    raise exception 'La venta de bolsas está cerrada por ahora.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Falta tu nombre.' using errcode = 'P0001';
  end if;
  if length(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')) < 8 then
    raise exception 'Revisá tu número de WhatsApp.' using errcode = 'P0001';
  end if;
  if p_entrega is null then
    raise exception 'Elegí dónde retirar la bolsa.' using errcode = 'P0001';
  end if;
  if coalesce(p_cantidad, 0) not between 1 and 10 then
    raise exception 'Cantidad de bolsas no válida.' using errcode = 'P0001';
  end if;

  select * into v_bolsa from public.bolsas where id = p_bolsa_id and activo;
  if not found then
    raise exception 'Esa bolsa no está disponible.' using errcode = 'P0001';
  end if;

  insert into public.pedidos (tipo, nombre, email, whatsapp, total, metodo_pago, canal, estado, vence_at,
                              es_regalo, regalo_para, regalo_mensaje, entrega)
  values ('bolsa', trim(p_nombre), nullif(trim(coalesce(p_email, '')), ''), trim(p_whatsapp), 0,
          p_metodo, 'online', 'pendiente', now() + interval '48 hours',
          coalesce(p_es_regalo, false),
          case when p_es_regalo then nullif(trim(coalesce(p_regalo_para, '')), '') end,
          case when p_es_regalo then nullif(trim(coalesce(p_regalo_mensaje, '')), '') end,
          p_entrega)
  returning * into v_pedido;

  insert into public.pedido_items (pedido_id, item_tipo, item_id, nombre, cantidad, precio_unit)
  values (v_pedido.id, 'bolsa', v_bolsa.id, v_bolsa.nombre, p_cantidad, v_bolsa.precio_base);
  v_total := p_cantidad * v_bolsa.precio_base;

  for v_extra in select * from jsonb_array_elements(coalesce(p_extras, '[]'::jsonb)) loop
    v_cant := coalesce((v_extra->>'cantidad')::int, 0);
    if v_cant <= 0 then continue; end if;
    if v_cant > 20 then
      raise exception 'Cantidad de extras no válida.' using errcode = 'P0001';
    end if;

    select p.id, p.nombre, p.precio, p.marca_id into v_prod
    from public.productos p join public.marcas m on m.id = p.marca_id
    where p.id = (v_extra->>'producto_id')::uuid
      and p.activo and p.agregable_a_bolsa and p.precio is not null and m.estado = 'confirmada';
    if not found then
      raise exception 'Uno de los productos extra ya no está disponible.' using errcode = 'P0001';
    end if;

    insert into public.pedido_items (pedido_id, item_tipo, item_id, nombre, marca_id, cantidad, precio_unit)
    values (v_pedido.id, 'producto', v_prod.id, v_prod.nombre, v_prod.marca_id, v_cant, v_prod.precio);
    v_total := v_total + v_cant * v_prod.precio;
  end loop;

  update public.pedidos set total = v_total where id = v_pedido.id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'token', v_pedido.token,
                            'total', v_total, 'vence_at', v_pedido.vence_at);
end; $$;

-- Ver un pedido por su link personal (/p/:token)
create or replace function public.ver_pedido(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  select * into v from public.pedidos where token = p_token;
  if not found then return null; end if;

  if v.estado = 'pendiente' and v.vence_at is not null and v.vence_at <= now() then
    update public.pedidos set estado = 'vencido' where id = v.id returning * into v;
  end if;

  return jsonb_build_object(
    'codigo', v.codigo, 'token', v.token, 'tipo', v.tipo, 'nombre', v.nombre,
    'total', v.total, 'metodo_pago', v.metodo_pago, 'estado', v.estado,
    'vence_at', v.vence_at, 'tiene_comprobante', v.comprobante_path is not null,
    'es_regalo', v.es_regalo, 'regalo_para', v.regalo_para, 'entrega', v.entrega,
    'entregado', v.entregado, 'created_at', v.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
                'item_tipo', i.item_tipo, 'nombre', i.nombre, 'cantidad', i.cantidad,
                'precio_unit', i.precio_unit) order by i.item_tipo, i.nombre)
              from public.pedido_items i where i.pedido_id = v.id), '[]'::jsonb),
    'entradas', coalesce((select jsonb_agg(jsonb_build_object(
                'token', e.token, 'codigo_corto', e.codigo_corto, 'titular_nombre', e.titular_nombre,
                'tipo', t.nombre, 'activa', e.activa) order by e.created_at)
              from public.entradas e join public.tipos_entrada t on t.id = e.tipo_entrada_id
              where e.pedido_id = v.id), '[]'::jsonb),
    'pago', public.cfg('pago')
  );
end; $$;

-- Ver una entrada por su link personal (/e/:token)
create or replace function public.ver_entrada(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'token', e.token, 'codigo_corto', e.codigo_corto, 'titular_nombre', e.titular_nombre,
    'activa', e.activa, 'ingreso_at', e.ingreso_at, 'almuerzo_at', e.almuerzo_at,
    'tipo', jsonb_build_object('nombre', t.nombre, 'descripcion', t.descripcion,
                               'incluye_almuerzo', t.incluye_almuerzo,
                               'incluye_festival', t.incluye_festival, 'valor_canje', t.valor_canje),
    'pedido', jsonb_build_object('codigo', p.codigo, 'estado', p.estado,
                                 'metodo_pago', p.metodo_pago),
    'canje', (select jsonb_build_object('puesto', pu.nombre, 'at', c.created_at)
              from public.canjes c join public.puestos pu on pu.id = c.puesto_id
              where c.entrada_id = e.id)
  )
  from public.entradas e
  join public.tipos_entrada t on t.id = e.tipo_entrada_id
  join public.pedidos p on p.id = e.pedido_id
  where e.token = p_token;
$$;

-- ¿Se puede subir comprobante a este pedido? (lo usa la política de Storage)
create or replace function public.pedido_acepta_comprobante(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pedidos
    where token = p_token and metodo_pago = 'transferencia'
      and (estado in ('comprobante_enviado', 'rechazado')
           or (estado = 'pendiente' and (vence_at is null or vence_at > now())))
  );
$$;

-- Registrar el comprobante subido (después de subir el archivo a Storage)
create or replace function public.registrar_comprobante(p_token text, p_path text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.pedido_acepta_comprobante(p_token) then
    raise exception 'Este pedido ya no acepta comprobantes. Escribinos por WhatsApp.' using errcode = 'P0001';
  end if;
  if p_path is null or split_part(p_path, '/', 1) <> p_token then
    raise exception 'Archivo no válido.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'comprobantes' and name = p_path) then
    raise exception 'No encontramos el archivo. Probá subirlo de nuevo.' using errcode = 'P0001';
  end if;

  -- Con comprobante subido, el pedido ya no vence hasta que alguien lo revise.
  update public.pedidos
  set comprobante_path = p_path, comprobante_at = now(), estado = 'comprobante_enviado', vence_at = null
  where token = p_token;
  return jsonb_build_object('ok', true);
end; $$;

-- Desafío: grilla pública (los videos solo se ven si están publicados y llegó su fecha)
create or replace function public.desafio_grilla()
returns table (dia int, fecha date, habilitado boolean, titulo text, descripcion text, youtube_url text)
language sql stable security definer set search_path = '' as $$
  select d.dia, d.fecha, h.ok,
         case when h.ok then d.titulo end,
         case when h.ok then d.descripcion end,
         case when h.ok then d.youtube_url end
  from public.desafio_dias d
  cross join lateral (select d.publicado and d.fecha <= public.ahora_mendoza()::date as ok) h
  order by d.dia;
$$;

-- Desafío: inscripción
create or replace function public.inscribir_desafio(
  p_nombre text, p_email text, p_whatsapp text, p_ciudad text, p_como_se_entero text, p_acepta boolean
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_token text;
begin
  if p_acepta is not true then
    raise exception 'Necesitamos tu consentimiento para inscribirte.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Falta tu nombre.' using errcode = 'P0001';
  end if;
  if coalesce(p_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Revisá tu email.' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.desafio_inscripciones where lower(email) = lower(trim(p_email))) then
    return jsonb_build_object('ok', true, 'ya_inscripta', true);
  end if;

  insert into public.desafio_inscripciones (nombre, email, whatsapp, ciudad, como_se_entero, acepta_comunicaciones)
  values (trim(p_nombre), lower(trim(p_email)), nullif(trim(coalesce(p_whatsapp, '')), ''),
          nullif(trim(coalesce(p_ciudad, '')), ''), nullif(trim(coalesce(p_como_se_entero, '')), ''), true)
  returning token into v_token;

  return jsonb_build_object('ok', true, 'ya_inscripta', false, 'token', v_token);
end; $$;

-- Sumá tu marca: postulación pública
create or replace function public.postular_marca(
  p_nombre text, p_rubro text, p_descripcion text, p_instagram text, p_whatsapp text,
  p_web text, p_contacto text, p_mensaje text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_slug text; v_base text; n int := 1;
begin
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Falta el nombre de la marca.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_contacto, ''))) < 3 then
    raise exception 'Dejanos un contacto (nombre y WhatsApp o email).' using errcode = 'P0001';
  end if;

  v_base := nullif(public.slugify(p_nombre), '');
  v_base := coalesce(v_base, 'marca');
  v_slug := v_base;
  while exists (select 1 from public.marcas where slug = v_slug) loop
    n := n + 1; v_slug := v_base || '-' || n;
  end loop;

  insert into public.marcas (nombre, slug, tipo, rubro, descripcion, instagram, whatsapp, web,
                             estado, contacto_interno, notas_internas)
  values (trim(p_nombre), v_slug, 'feriante', nullif(trim(coalesce(p_rubro, '')), ''),
          left(nullif(trim(coalesce(p_descripcion, '')), ''), 2000),
          nullif(trim(coalesce(p_instagram, '')), ''), nullif(trim(coalesce(p_whatsapp, '')), ''),
          nullif(trim(coalesce(p_web, '')), ''), 'postulada', left(trim(p_contacto), 500),
          left(nullif(trim(coalesce(p_mensaje, '')), ''), 2000));
  return jsonb_build_object('ok', true);
end; $$;

-- =============================================================
-- PANEL (guardianas)
-- =============================================================

create or replace function public.validar_pago(p_pedido_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; r record;
begin
  if not public.tiene_rol('admin') then
    raise exception 'No tenés permiso para validar pagos.' using errcode = '42501';
  end if;
  select * into v from public.pedidos where id = p_pedido_id for update;
  if not found then raise exception 'Pedido inexistente.' using errcode = 'P0001'; end if;
  if v.estado = 'pagado' then return jsonb_build_object('ok', true, 'ya_pagado', true); end if;
  if v.estado = 'cancelado' then
    raise exception 'El pedido está cancelado.' using errcode = 'P0001';
  end if;

  -- Si el pedido estaba vencido o rechazado, ya no ocupaba cupo: hay que volver a verificarlo.
  if v.estado in ('vencido', 'rechazado') or (v.estado = 'pendiente' and v.vence_at <= now()) then
    for r in
      select t.id, t.nombre, t.cupo, count(*)::int as cant
      from public.entradas e join public.tipos_entrada t on t.id = e.tipo_entrada_id
      where e.pedido_id = v.id and t.cupo is not null
      group by t.id, t.nombre, t.cupo
    loop
      perform 1 from public.tipos_entrada where id = r.id for update;
      if public.ocupadas_tipo(r.id) + r.cant > r.cupo then
        raise exception 'No quedan lugares de "%" para reactivar este pedido.', r.nombre using errcode = 'P0001';
      end if;
    end loop;
  end if;

  update public.pedidos
  set estado = 'pagado', validado_por = auth.uid(), validado_at = now(), vence_at = null
  where id = v.id;
  update public.entradas set activa = true where pedido_id = v.id;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.rechazar_pago(p_pedido_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  update public.pedidos
  set estado = 'rechazado', validado_por = auth.uid(), validado_at = now(),
      notas = concat_ws(E'\n', notas, 'Rechazado: ' || nullif(trim(coalesce(p_motivo, '')), ''))
  where id = p_pedido_id and estado <> 'pagado';
  if not found then raise exception 'No se puede rechazar este pedido.' using errcode = 'P0001'; end if;
  update public.entradas set activa = false where pedido_id = p_pedido_id;
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.cancelar_pedido(p_pedido_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  if exists (select 1 from public.canjes c join public.entradas e on e.id = c.entrada_id
             where e.pedido_id = p_pedido_id) then
    raise exception 'Este pedido tiene entradas ya canjeadas: no se puede anular.' using errcode = 'P0001';
  end if;
  update public.pedidos
  set estado = 'cancelado',
      notas = concat_ws(E'\n', notas, 'Anulado: ' || nullif(trim(coalesce(p_motivo, '')), ''))
  where id = p_pedido_id;
  update public.entradas set activa = false where pedido_id = p_pedido_id;
  return jsonb_build_object('ok', true);
end; $$;

-- Link firmado para ver un comprobante (solo admin) lo da Storage; esta función devuelve la lista de pendientes.
create or replace function public.pagos_pendientes()
returns table (
  id uuid, codigo text, tipo public.pedido_tipo, nombre text, email text, whatsapp text, total int,
  metodo_pago public.metodo_pago, estado public.pedido_estado, comprobante_path text,
  vence_at timestamptz, created_at timestamptz, token text, detalle text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  return query
    select p.id, p.codigo, p.tipo, p.nombre, p.email, p.whatsapp, p.total, p.metodo_pago, p.estado,
           p.comprobante_path, p.vence_at, p.created_at, p.token,
           (select string_agg(i.cantidad || ' × ' || i.nombre, ', ' order by i.item_tipo)
            from public.pedido_items i where i.pedido_id = p.id)
    from public.pedidos p
    where p.estado in ('pendiente', 'comprobante_enviado')
    order by (p.estado = 'comprobante_enviado') desc, p.created_at;
end; $$;

-- Alta de guardianas: la usuaria se crea en Supabase (Authentication → Add user) y acá se le asignan roles.
create or replace function public.asignar_roles(p_email text, p_nombre text, p_roles public.rol_guardiana[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  if not public.tiene_rol('admin') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then
    raise exception 'No existe una cuenta con ese email. Creala primero en Supabase → Authentication.' using errcode = 'P0001';
  end if;
  insert into public.perfiles (user_id, nombre, email, roles)
  values (v_uid, coalesce(nullif(trim(p_nombre), ''), p_email), lower(trim(p_email)), coalesce(p_roles, '{}'))
  on conflict (user_id) do update set nombre = excluded.nombre, email = excluded.email, roles = excluded.roles;
  return jsonb_build_object('ok', true);
end; $$;

-- Métricas del panel
create or replace function public.metricas_panel()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_guardiana() then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'inscriptas_desafio', (select count(*) from public.desafio_inscripciones),
    'pagos_por_revisar', (select count(*) from public.pedidos where estado = 'comprobante_enviado'),
    'pendientes', (select count(*) from public.pedidos where estado = 'pendiente' and (vence_at is null or vence_at > now())),
    'entradas', coalesce((select jsonb_agg(x order by x->>'orden') from (
        select jsonb_build_object(
          'tipo', t.nombre, 'orden', t.orden, 'cupo', t.cupo,
          'pagadas', count(*) filter (where p.estado = 'pagado'),
          'reservadas', count(*) filter (where p.estado <> 'pagado' and public.pedido_ocupa_cupo(p.estado, p.vence_at)),
          'ingresaron', count(*) filter (where e.ingreso_at is not null),
          'almuerzos_retirados', count(*) filter (where e.almuerzo_at is not null),
          'incluye_almuerzo', t.incluye_almuerzo
        ) as x
        from public.tipos_entrada t
        left join public.entradas e on e.tipo_entrada_id = t.id
        left join public.pedidos p on p.id = e.pedido_id
        group by t.id) s), '[]'::jsonb),
    'canjes', (select count(*) from public.canjes),
    'capacidad_canje', jsonb_build_object(
        'sin_tope', exists (select 1 from public.puestos where activo and cupo_canjes is null),
        'cupos', (select coalesce(sum(cupo_canjes), 0) from public.puestos where activo),
        'entradas_canjeables', (select count(*) from public.entradas e
                                join public.tipos_entrada t on t.id = e.tipo_entrada_id
                                join public.pedidos p on p.id = e.pedido_id
                                where t.valor_canje > 0 and public.pedido_ocupa_cupo(p.estado, p.vence_at))),
    'bolsas_pagadas', (select coalesce(sum(i.cantidad), 0) from public.pedido_items i
                       join public.pedidos p on p.id = i.pedido_id
                       where i.item_tipo = 'bolsa' and p.estado = 'pagado'),
    'efectivo_puerta', (select coalesce(sum(total), 0) from public.pedidos
                        where canal = 'puerta' and metodo_pago = 'efectivo' and estado = 'pagado')
  );
end; $$;

-- =============================================================
-- Permisos de ejecución (todo cerrado; se abre una por una)
-- =============================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.tiene_rol(public.rol_guardiana) to authenticated;
grant execute on function public.es_guardiana() to anon, authenticated;

grant execute on function public.tipos_entrada_disponibles() to anon, authenticated;
grant execute on function public.crear_pedido_entradas(text, text, text, public.metodo_pago, jsonb) to anon, authenticated;
grant execute on function public.crear_pedido_bolsa(text, text, text, public.metodo_pago, uuid, int, jsonb, boolean, text, text, public.entrega_tipo) to anon, authenticated;
grant execute on function public.ver_pedido(text) to anon, authenticated;
grant execute on function public.ver_entrada(text) to anon, authenticated;
grant execute on function public.pedido_acepta_comprobante(text) to anon, authenticated;
grant execute on function public.registrar_comprobante(text, text) to anon, authenticated;
grant execute on function public.desafio_grilla() to anon, authenticated;
grant execute on function public.inscribir_desafio(text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.postular_marca(text, text, text, text, text, text, text, text) to anon, authenticated;

grant execute on function public.validar_pago(uuid) to authenticated;
grant execute on function public.rechazar_pago(uuid, text) to authenticated;
grant execute on function public.cancelar_pedido(uuid, text) to authenticated;
grant execute on function public.pagos_pendientes() to authenticated;
grant execute on function public.asignar_roles(text, text, public.rol_guardiana[]) to authenticated;
grant execute on function public.metricas_panel() to authenticated;
grant execute on function public.vencer_pedidos() to authenticated;

-- Las funciones nuevas que se creen después tampoco quedan abiertas por defecto.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
