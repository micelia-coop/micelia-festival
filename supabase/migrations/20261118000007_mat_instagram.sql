-- =============================================================
-- 0007 · Mat de yoga (cada entrada de la mañana indica si trae mat o necesita que se lo presten)
--         + usuario de Instagram opcional en compras e inscripciones.
-- =============================================================

alter table public.tipos_entrada add column if not exists pregunta_mat boolean not null default false;
alter table public.entradas add column if not exists trae_mat boolean;   -- null = no aplica

update public.tipos_entrada set pregunta_mat = true where incluye_almuerzo;  -- la Mañana completa

-- Usuario de Instagram (opcional) en compras e inscripciones al desafío
alter table public.pedidos add column if not exists instagram text;
alter table public.desafio_inscripciones add column if not exists instagram text;

create or replace function public.limpiar_ig(t text)
returns text language sql immutable set search_path = '' as $$
  select nullif(left(regexp_replace(
    regexp_replace(trim(coalesce(t, '')), '^(https?://)?(www\.)?instagram\.com/', '', 'i'),
    '^@|/.*$|\?.*$', '', 'g'), 60), '');
$$;

-- Cambian las firmas (se agrega p_instagram): se borran las versiones viejas.
drop function if exists public.crear_pedido_entradas(text, text, text, public.metodo_pago, jsonb);
drop function if exists public.crear_pedido_bolsa(text, text, text, public.metodo_pago, uuid, int, jsonb, boolean, text, text, public.entrega_tipo);
drop function if exists public.inscribir_desafio(text, text, text, text, text, boolean);
drop function if exists public.pagos_pendientes();

-- Cambia el tipo de retorno: hay que borrarla y recrearla.
drop function if exists public.tipos_entrada_disponibles();

create or replace function public.tipos_entrada_disponibles()
returns table (
  id uuid, nombre text, descripcion text, precio int, cupo int, restantes int,
  incluye_almuerzo boolean, incluye_festival boolean, valor_canje int, orden int, pregunta_mat boolean
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.nombre, t.descripcion, t.precio, t.cupo,
         case when t.cupo is null then null else greatest(t.cupo - public.ocupadas_tipo(t.id), 0) end,
         t.incluye_almuerzo, t.incluye_festival, t.valor_canje, t.orden, t.pregunta_mat
  from public.tipos_entrada t
  where t.activo and t.venta_online
  order by t.orden;
$$;

create or replace function public.crear_pedido_entradas(
  p_nombre text, p_email text, p_whatsapp text, p_metodo public.metodo_pago, p_items jsonb, p_instagram text default null
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
                'tipo', t.nombre, 'activa', e.activa, 'trae_mat', e.trae_mat) order by e.created_at)
              from public.entradas e join public.tipos_entrada t on t.id = e.tipo_entrada_id
              where e.pedido_id = v.id), '[]'::jsonb),
    'pago', public.cfg('pago')
  );
end; $$;

create or replace function public.ver_entrada(p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'token', e.token, 'codigo_corto', e.codigo_corto, 'titular_nombre', e.titular_nombre,
    'activa', e.activa, 'ingreso_at', e.ingreso_at, 'almuerzo_at', e.almuerzo_at, 'trae_mat', e.trae_mat,
    'tipo', jsonb_build_object('nombre', t.nombre, 'descripcion', t.descripcion,
                               'incluye_almuerzo', t.incluye_almuerzo,
                               'incluye_festival', t.incluye_festival, 'valor_canje', t.valor_canje,
                               'pregunta_mat', t.pregunta_mat),
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
          'pregunta_mat', t.pregunta_mat,
          'mats_a_prestar', count(*) filter (where e.trae_mat = false and public.pedido_ocupa_cupo(p.estado, p.vence_at)),
          'mats_propios', count(*) filter (where e.trae_mat = true and public.pedido_ocupa_cupo(p.estado, p.vence_at)),
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

create or replace function public.crear_pedido_bolsa(
  p_nombre text, p_email text, p_whatsapp text, p_metodo public.metodo_pago,
  p_bolsa_id uuid, p_cantidad int, p_extras jsonb,
  p_es_regalo boolean, p_regalo_para text, p_regalo_mensaje text, p_entrega public.entrega_tipo,
  p_instagram text default null
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

  insert into public.pedidos (tipo, nombre, email, whatsapp, instagram, total, metodo_pago, canal, estado, vence_at,
                              es_regalo, regalo_para, regalo_mensaje, entrega)
  values ('bolsa', trim(p_nombre), nullif(trim(coalesce(p_email, '')), ''), trim(p_whatsapp), public.limpiar_ig(p_instagram), 0,
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

create or replace function public.inscribir_desafio(
  p_nombre text, p_email text, p_whatsapp text, p_ciudad text, p_como_se_entero text, p_acepta boolean,
  p_instagram text default null
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

  insert into public.desafio_inscripciones (nombre, email, whatsapp, instagram, ciudad, como_se_entero, acepta_comunicaciones)
  values (trim(p_nombre), lower(trim(p_email)), nullif(trim(coalesce(p_whatsapp, '')), ''), public.limpiar_ig(p_instagram),
          nullif(trim(coalesce(p_ciudad, '')), ''), nullif(trim(coalesce(p_como_se_entero, '')), ''), true)
  returning token into v_token;

  return jsonb_build_object('ok', true, 'ya_inscripta', false, 'token', v_token);
end; $$;

create or replace function public.pagos_pendientes()
returns table (
  id uuid, codigo text, tipo public.pedido_tipo, nombre text, email text, whatsapp text, instagram text, total int,
  metodo_pago public.metodo_pago, estado public.pedido_estado, comprobante_path text,
  vence_at timestamptz, created_at timestamptz, token text, detalle text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.tiene_rol('admin') then
    raise exception 'No tenés permiso.' using errcode = '42501';
  end if;
  return query
    select p.id, p.codigo, p.tipo, p.nombre, p.email, p.whatsapp, p.instagram, p.total, p.metodo_pago, p.estado,
           p.comprobante_path, p.vence_at, p.created_at, p.token,
           (select string_agg(i.cantidad || ' × ' || i.nombre, ', ' order by i.item_tipo)
            from public.pedido_items i where i.pedido_id = p.id)
    from public.pedidos p
    where p.estado in ('pendiente', 'comprobante_enviado')
    order by (p.estado = 'comprobante_enviado') desc, p.created_at;
end; $$;

grant execute on function public.tipos_entrada_disponibles() to anon, authenticated;
grant execute on function public.crear_pedido_entradas(text, text, text, public.metodo_pago, jsonb, text) to anon, authenticated;
grant execute on function public.crear_pedido_bolsa(text, text, text, public.metodo_pago, uuid, int, jsonb, boolean, text, text, public.entrega_tipo, text) to anon, authenticated;
grant execute on function public.inscribir_desafio(text, text, text, text, text, boolean, text) to anon, authenticated;
grant execute on function public.pagos_pendientes() to authenticated;
