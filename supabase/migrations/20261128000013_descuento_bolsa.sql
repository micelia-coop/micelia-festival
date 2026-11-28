-- =============================================================
-- 0013 · Descuento en la Bolsa Ritual con la entrada de la tarde
--   - % configurable en config 'bolsa' → descuento_entrada_pct (sin % cargado, no aplica)
--   - cada entrada se usa una sola vez (online o, más adelante, en el festival)
-- =============================================================

alter table public.tipos_entrada add column if not exists descuento_bolsa boolean not null default false;
update public.tipos_entrada set descuento_bolsa = true where valor_canje > 0 and not incluye_almuerzo;

alter table public.pedidos add column if not exists descuento integer not null default 0;
alter table public.pedidos add column if not exists descuento_entrada text;
alter table public.entradas add column if not exists descuento_bolsa_pedido uuid references public.pedidos (id) on delete set null;
alter table public.entradas add column if not exists descuento_bolsa_at timestamptz;   -- uso en el festival (escáner)

-- ¿La entrada ya usó su descuento? (pedido de bolsa pagado o todavía vigente, o usado en el festival)
create or replace function public.entrada_descuento_usado(p_entrada uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.entradas e
    left join public.pedidos p on p.id = e.descuento_bolsa_pedido
    where e.id = p_entrada
      and (e.descuento_bolsa_at is not null
           or (p.id is not null and (p.estado = 'pagado' or public.pedido_ocupa_cupo(p.estado, p.vence_at))))
  );
$$;

create or replace function public.verificar_codigo_descuento(p_codigo text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_pct numeric; e record;
begin
  v_pct := nullif(public.cfg('bolsa')->>'descuento_entrada_pct', '')::numeric;
  if v_pct is null or v_pct <= 0 then
    return jsonb_build_object('ok', false, 'mensaje', 'Por ahora no hay descuento con entrada.');
  end if;
  select en.id, en.activa, t.descuento_bolsa, p.estado into e
  from public.entradas en
  join public.tipos_entrada t on t.id = en.tipo_entrada_id
  join public.pedidos p on p.id = en.pedido_id
  where upper(en.codigo_corto) = upper(trim(coalesce(p_codigo, '')));
  if not found then
    return jsonb_build_object('ok', false, 'mensaje', 'No encontramos ese código de entrada. Revisalo (es el MIC-XXXX que está debajo del QR).');
  end if;
  if not e.descuento_bolsa then
    return jsonb_build_object('ok', false, 'mensaje', 'El descuento es solo con la entrada de la tarde.');
  end if;
  if not e.activa or e.estado <> 'pagado' then
    return jsonb_build_object('ok', false, 'mensaje', 'Esa entrada todavía no está pagada.');
  end if;
  if public.entrada_descuento_usado(e.id) then
    return jsonb_build_object('ok', false, 'mensaje', 'Esa entrada ya usó su descuento.');
  end if;
  return jsonb_build_object('ok', true, 'pct', v_pct, 'mensaje', format('¡Listo! %s%% de descuento en la bolsa.', trim(to_char(v_pct, 'FM999D##'))));
end; $$;

drop function if exists public.tipos_entrada_disponibles();
drop function if exists public.crear_pedido_bolsa(text, text, text, public.metodo_pago, uuid, int, jsonb, boolean, text, text, public.entrega_tipo, text);

create or replace function public.tipos_entrada_disponibles()
returns table (
  id uuid, nombre text, descripcion text, precio int, cupo int, restantes int,
  incluye_almuerzo boolean, incluye_festival boolean, valor_canje int, orden int, pregunta_mat boolean, descuento_bolsa boolean
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.nombre, t.descripcion, t.precio, t.cupo,
         case when t.cupo is null then null else greatest(t.cupo - public.ocupadas_tipo(t.id), 0) end,
         t.incluye_almuerzo, t.incluye_festival, t.valor_canje, t.orden, t.pregunta_mat, t.descuento_bolsa
  from public.tipos_entrada t
  where t.activo and t.venta_online
  order by t.orden;
$$;

create or replace function public.crear_pedido_bolsa(
  p_nombre text, p_email text, p_whatsapp text, p_metodo public.metodo_pago,
  p_bolsa_id uuid, p_cantidad int, p_extras jsonb,
  p_es_regalo boolean, p_regalo_para text, p_regalo_mensaje text, p_entrega public.entrega_tipo,
  p_instagram text default null, p_codigo_entrada text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido public.pedidos;
  v_bolsa public.bolsas;
  v_prod record;
  v_extra jsonb;
  v_cant int;
  v_total int := 0;
  v_desc jsonb;
  v_entrada_id uuid;
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

  -- Descuento por entrada de la tarde (sobre el precio base de una bolsa)
  if nullif(trim(coalesce(p_codigo_entrada, '')), '') is not null then
    v_desc := public.verificar_codigo_descuento(p_codigo_entrada);
    if (v_desc->>'ok')::boolean is not true then
      raise exception '%', v_desc->>'mensaje' using errcode = 'P0001';
    end if;
    select e.id into v_entrada_id from public.entradas e where upper(e.codigo_corto) = upper(trim(p_codigo_entrada)) for update;
    update public.pedidos
    set descuento = least(round(v_bolsa.precio_base * (v_desc->>'pct')::numeric / 100)::int, v_total),
        descuento_entrada = upper(trim(p_codigo_entrada))
    where id = v_pedido.id;
    update public.entradas set descuento_bolsa_pedido = v_pedido.id where id = v_entrada_id;
    v_total := v_total - least(round(v_bolsa.precio_base * (v_desc->>'pct')::numeric / 100)::int, v_total);
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

revoke execute on function public.entrada_descuento_usado(uuid) from public, anon, authenticated;
grant execute on function public.verificar_codigo_descuento(text) to anon, authenticated;
grant execute on function public.tipos_entrada_disponibles() to anon, authenticated;
grant execute on function public.crear_pedido_bolsa(text, text, text, public.metodo_pago, uuid, int, jsonb, boolean, text, text, public.entrega_tipo, text, text) to anon, authenticated;
