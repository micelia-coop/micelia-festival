-- =============================================================
-- 0014 · Día del festival: puerta, descuento de bolsa en el puesto, sorteo
--         y códigos de descuento de marcas aliadas (para entradas)
-- =============================================================

-- ---------- Número de sorteo por entrada ----------
create sequence if not exists public.entradas_numero_seq;
alter table public.entradas add column if not exists numero integer;
update public.entradas e set numero = s.n
from (select id, row_number() over (order by created_at, id) as n from public.entradas) s
where e.id = s.id and e.numero is null;
select setval('public.entradas_numero_seq', greatest(coalesce((select max(numero) from public.entradas), 0), 1),
              (select max(numero) from public.entradas) is not null);
alter table public.entradas alter column numero set default nextval('public.entradas_numero_seq');
create unique index if not exists entradas_numero_idx on public.entradas (numero);

-- ---------- Horario de ingreso por tipo de entrada ----------
alter table public.tipos_entrada add column if not exists ingreso_desde time;   -- null = sin restricción
update public.tipos_entrada set ingreso_desde = '12:30' where descuento_bolsa and ingreso_desde is null;

-- ---------- Códigos de descuento de marcas (para entradas) ----------
create table if not exists public.codigos_descuento (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null,
  marca_id   uuid references public.marcas (id) on delete set null,
  pct        numeric(5,2) not null default 0 check (pct between 0 and 100),
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists codigos_descuento_codigo_idx on public.codigos_descuento (upper(codigo));
alter table public.codigos_descuento enable row level security;
revoke all on public.codigos_descuento from anon;
drop policy if exists codigos_alianzas on public.codigos_descuento;
create policy codigos_alianzas on public.codigos_descuento for all to authenticated
  using ((select public.tiene_rol('alianzas'))) with check ((select public.tiene_rol('alianzas')));

alter table public.pedidos add column if not exists codigo_descuento_id uuid references public.codigos_descuento (id) on delete set null;

create or replace function public.verificar_codigo_marca(p_codigo text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select jsonb_build_object('ok', true, 'pct', c.pct, 'marca', m.nombre,
       'mensaje', case when c.pct > 0 then format('¡Listo! %s%% de descuento (código de %s).', trim(to_char(c.pct, 'FM999D##')), coalesce(m.nombre, 'una marca aliada'))
                       else format('Código de %s registrado. ¡Gracias por venir de su parte!', coalesce(m.nombre, 'una marca aliada')) end)
     from public.codigos_descuento c left join public.marcas m on m.id = c.marca_id
     where upper(c.codigo) = upper(trim(coalesce(p_codigo, ''))) and c.activo),
    jsonb_build_object('ok', false, 'mensaje', 'Ese código no existe o ya no está activo.'));
$$;

create or replace function public.reporte_codigos()
returns table (id uuid, codigo text, marca text, pct numeric, activo boolean, pedidos_pagados bigint, entradas bigint, total_vendido bigint, total_descontado bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.tiene_rol('alianzas') then raise exception 'No tenés permiso.' using errcode = '42501'; end if;
  return query
    select c.id, c.codigo, m.nombre, c.pct, c.activo,
      (select count(*) from public.pedidos p where p.codigo_descuento_id = c.id and p.estado = 'pagado'),
      (select count(*) from public.entradas e join public.pedidos p on p.id = e.pedido_id where p.codigo_descuento_id = c.id and p.estado = 'pagado'),
      (select coalesce(sum(p.total), 0)::bigint from public.pedidos p where p.codigo_descuento_id = c.id and p.estado = 'pagado'),
      (select coalesce(sum(p.descuento), 0)::bigint from public.pedidos p where p.codigo_descuento_id = c.id and p.estado = 'pagado')
    from public.codigos_descuento c
    left join public.marcas m on m.id = c.marca_id
    order by c.codigo;
end; $$;

drop function if exists public.crear_pedido_entradas(text, text, text, public.metodo_pago, jsonb, text);

create or replace function public.crear_pedido_entradas(
  p_nombre text, p_email text, p_whatsapp text, p_metodo public.metodo_pago, p_items jsonb, p_instagram text default null, p_codigo_descuento text default null
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
  v_mats jsonb;
  v_mat boolean;
  v_cod public.codigos_descuento;
  v_desc int := 0;
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

  insert into public.pedidos (tipo, nombre, email, whatsapp, instagram, total, metodo_pago, canal, estado, vence_at)
  values ('entrada', trim(p_nombre), nullif(trim(coalesce(p_email, '')), ''), trim(p_whatsapp),
          public.limpiar_ig(p_instagram), 0,
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
    v_mats := coalesce(v_item->'mats', '[]'::jsonb);
    for i in 0..(v_cant - 1) loop
      v_titular := nullif(trim(coalesce(v_titulares->>i, '')), '');
      v_mat := case when jsonb_typeof(v_mats->i) = 'boolean' then (v_mats->>i)::boolean end;
      if v_tipo.pregunta_mat and v_mat is null then
        raise exception 'Contanos si cada persona trae su mat o necesita que se lo prestemos.' using errcode = 'P0001';
      end if;
      insert into public.entradas (pedido_id, tipo_entrada_id, titular_nombre, trae_mat)
      values (v_pedido.id, v_tipo.id, coalesce(v_titular, trim(p_nombre)),
              case when v_tipo.pregunta_mat then v_mat end);
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

  -- Código de descuento de una marca aliada
  if nullif(trim(coalesce(p_codigo_descuento, '')), '') is not null then
    select * into v_cod from public.codigos_descuento
    where upper(codigo) = upper(trim(p_codigo_descuento)) and activo;
    if not found then
      raise exception 'Ese código de descuento no existe o ya no está activo.' using errcode = 'P0001';
    end if;
    v_desc := least(round(v_total * v_cod.pct / 100)::int, v_total);
    update public.pedidos set codigo_descuento_id = v_cod.id, descuento = v_desc, descuento_entrada = upper(v_cod.codigo)
    where id = v_pedido.id;
    v_total := v_total - v_desc;
  end if;

  update public.pedidos set total = v_total where id = v_pedido.id;

  return jsonb_build_object('codigo', v_pedido.codigo, 'token', v_pedido.token,
                            'total', v_total, 'vence_at', v_pedido.vence_at);
end; $$;

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
    'total', v.total, 'descuento', v.descuento, 'descuento_entrada', v.descuento_entrada, 'metodo_pago', v.metodo_pago, 'estado', v.estado,
    'vence_at', v.vence_at, 'tiene_comprobante', v.comprobante_path is not null,
    'es_regalo', v.es_regalo, 'regalo_para', v.regalo_para, 'entrega', v.entrega,
    'entregado', v.entregado, 'created_at', v.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
                'item_tipo', i.item_tipo, 'nombre', i.nombre, 'cantidad', i.cantidad,
                'precio_unit', i.precio_unit) order by i.item_tipo, i.nombre)
              from public.pedido_items i where i.pedido_id = v.id), '[]'::jsonb),
    'entradas', coalesce((select jsonb_agg(jsonb_build_object(
                'token', e.token, 'codigo_corto', e.codigo_corto, 'titular_nombre', e.titular_nombre,
                'tipo', t.nombre, 'activa', e.activa, 'trae_mat', e.trae_mat, 'numero', e.numero) order by e.created_at)
              from public.entradas e join public.tipos_entrada t on t.id = e.tipo_entrada_id
              where e.pedido_id = v.id), '[]'::jsonb),
    'pago', public.cfg('pago')
  );
end; $$;

create or replace function public.ver_entrada(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'token', e.token, 'codigo_corto', e.codigo_corto, 'numero', e.numero, 'titular_nombre', e.titular_nombre,
    'activa', e.activa, 'ingreso_at', e.ingreso_at, 'almuerzo_at', e.almuerzo_at, 'trae_mat', e.trae_mat,
    'tipo', jsonb_build_object('nombre', t.nombre, 'descripcion', t.descripcion,
                               'incluye_almuerzo', t.incluye_almuerzo,
                               'incluye_festival', t.incluye_festival, 'valor_canje', t.valor_canje,
                               'pregunta_mat', t.pregunta_mat, 'descuento_bolsa', t.descuento_bolsa),
    'descuento_bolsa_usado', public.entrada_descuento_usado(e.id),
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

-- ---------- Puerta: registrar ingreso ----------
-- p_codigo: el token del QR (o la URL completa) o el código corto MIC-XXXX.
create or replace function public.buscar_entrada(p_codigo text)
returns uuid language sql stable security definer set search_path = '' as $$
  select e.id from public.entradas e
  where e.token = regexp_replace(trim(coalesce(p_codigo, '')), '^.*/e/', '')
     or upper(e.codigo_corto) = upper(trim(coalesce(p_codigo, '')))
  limit 1;
$$;

create or replace function public.registrar_ingreso(p_codigo text, p_forzar boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; e record; v_ahora timestamp := public.ahora_mendoza();
begin
  if not public.tiene_rol('puerta') then raise exception 'No tenés permiso.' using errcode = '42501'; end if;
  v_id := public.buscar_entrada(p_codigo);
  if v_id is null then return jsonb_build_object('resultado', 'no_valida', 'mensaje', 'No encontramos esta entrada.'); end if;

  select en.id, en.titular_nombre, en.numero, en.codigo_corto, en.activa, en.ingreso_at, t.nombre as tipo, t.ingreso_desde, p.estado
  into e
  from public.entradas en join public.tipos_entrada t on t.id = en.tipo_entrada_id join public.pedidos p on p.id = en.pedido_id
  where en.id = v_id for update of en;

  if p_forzar is not true and (not e.activa or e.estado <> 'pagado') then
    return jsonb_build_object('resultado', 'no_valida', 'mensaje',
      case when e.estado in ('cancelado', 'rechazado', 'vencido') then 'Entrada anulada.' else 'Entrada sin pagar.' end,
      'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero, 'codigo', e.codigo_corto);
  end if;
  if e.ingreso_at is not null then
    return jsonb_build_object('resultado', 'ya_ingreso', 'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero,
      'codigo', e.codigo_corto, 'ingreso_at', e.ingreso_at);
  end if;
  if p_forzar is not true and e.ingreso_desde is not null and v_ahora::time < e.ingreso_desde then
    return jsonb_build_object('resultado', 'temprano', 'mensaje', format('Esta entrada puede ingresar desde las %s.', to_char(e.ingreso_desde, 'HH24:MI')),
      'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero, 'codigo', e.codigo_corto);
  end if;

  update public.entradas set ingreso_at = now(),
    ingreso_por = (select nombre from public.perfiles where user_id = auth.uid())
  where id = e.id;
  return jsonb_build_object('resultado', 'ok', 'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero, 'codigo', e.codigo_corto,
    'forzado', coalesce(p_forzar, false));
end; $$;

-- ---------- Puesto de la Bolsa: descuento con la entrada ----------
create or replace function public.descuento_bolsa_festival(p_codigo text, p_marcar boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; e record; v_pct numeric;
begin
  if not (public.tiene_rol('puerta') or public.tiene_rol('alianzas')) then raise exception 'No tenés permiso.' using errcode = '42501'; end if;
  v_pct := nullif(public.cfg('bolsa')->>'descuento_entrada_pct', '')::numeric;
  v_id := public.buscar_entrada(p_codigo);
  if v_id is null then return jsonb_build_object('resultado', 'no_valida', 'mensaje', 'No encontramos esta entrada.'); end if;
  select en.id, en.titular_nombre, en.numero, en.codigo_corto, en.activa, t.nombre as tipo, t.descuento_bolsa, p.estado
  into e from public.entradas en join public.tipos_entrada t on t.id = en.tipo_entrada_id join public.pedidos p on p.id = en.pedido_id
  where en.id = v_id for update of en;
  if not e.descuento_bolsa then
    return jsonb_build_object('resultado', 'no_aplica', 'mensaje', 'Esta entrada no tiene descuento en la bolsa (solo la de la tarde).', 'titular', e.titular_nombre, 'tipo', e.tipo);
  end if;
  if not e.activa or e.estado <> 'pagado' then
    return jsonb_build_object('resultado', 'no_valida', 'mensaje', 'Entrada sin pagar o anulada.', 'titular', e.titular_nombre, 'tipo', e.tipo);
  end if;
  if v_pct is null or v_pct <= 0 then
    return jsonb_build_object('resultado', 'no_aplica', 'mensaje', 'Todavía no hay un % de descuento cargado.', 'titular', e.titular_nombre, 'tipo', e.tipo);
  end if;
  if public.entrada_descuento_usado(e.id) then
    return jsonb_build_object('resultado', 'usado', 'mensaje', 'Esta entrada ya usó su descuento.', 'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero);
  end if;
  if p_marcar then
    update public.entradas set descuento_bolsa_at = now() where id = e.id;
    return jsonb_build_object('resultado', 'marcado', 'pct', v_pct, 'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero);
  end if;
  return jsonb_build_object('resultado', 'disponible', 'pct', v_pct, 'titular', e.titular_nombre, 'tipo', e.tipo, 'numero', e.numero, 'codigo', e.codigo_corto);
end; $$;

-- ---------- Sorteo (entre quienes ingresaron) ----------
create table if not exists public.sorteo_ganadores (
  id         uuid primary key default gen_random_uuid(),
  entrada_id uuid not null unique references public.entradas (id) on delete cascade,
  premio     text,
  created_at timestamptz not null default now()
);
alter table public.sorteo_ganadores enable row level security;
revoke all on public.sorteo_ganadores from anon;
drop policy if exists sorteo_leer on public.sorteo_ganadores;
create policy sorteo_leer on public.sorteo_ganadores for select to authenticated using ((select public.es_guardiana()));
drop policy if exists sorteo_borrar on public.sorteo_ganadores;
create policy sorteo_borrar on public.sorteo_ganadores for delete to authenticated using ((select public.tiene_rol('admin')));

create or replace function public.sortear(p_premio text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e record;
begin
  if not public.tiene_rol('admin') then raise exception 'No tenés permiso.' using errcode = '42501'; end if;
  select en.id, en.numero, en.titular_nombre, en.codigo_corto, t.nombre as tipo into e
  from public.entradas en join public.tipos_entrada t on t.id = en.tipo_entrada_id
  where en.ingreso_at is not null and not exists (select 1 from public.sorteo_ganadores g where g.entrada_id = en.id)
  order by random() limit 1;
  if not found then return jsonb_build_object('ok', false, 'mensaje', 'No hay más personas para sortear (tienen que haber ingresado al festival).'); end if;
  insert into public.sorteo_ganadores (entrada_id, premio) values (e.id, nullif(trim(coalesce(p_premio, '')), ''));
  return jsonb_build_object('ok', true, 'numero', e.numero, 'titular', e.titular_nombre, 'codigo', e.codigo_corto, 'tipo', e.tipo, 'premio', p_premio);
end; $$;

create or replace function public.sorteo_estado()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_guardiana() then raise exception 'No tenés permiso.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'participantes', (select count(*) from public.entradas where ingreso_at is not null),
    'ganadores', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'numero', e.numero, 'titular', e.titular_nombre, 'premio', g.premio, 'at', g.created_at) order by g.created_at)
                  from public.sorteo_ganadores g join public.entradas e on e.id = g.entrada_id), '[]'::jsonb));
end; $$;

-- ---------- Permisos ----------
revoke execute on function public.buscar_entrada(text) from public, anon, authenticated;
grant execute on function public.verificar_codigo_marca(text) to anon, authenticated;
grant execute on function public.reporte_codigos() to authenticated;
grant execute on function public.crear_pedido_entradas(text, text, text, public.metodo_pago, jsonb, text, text) to anon, authenticated;
grant execute on function public.registrar_ingreso(text, boolean) to authenticated;
grant execute on function public.descuento_bolsa_festival(text, boolean) to authenticated;
grant execute on function public.sortear(text) to authenticated;
grant execute on function public.sorteo_estado() to authenticated;
