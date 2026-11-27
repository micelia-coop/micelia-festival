-- =============================================================
-- 0012 · Pago con Mercado Pago (Checkout Pro)
--   - nuevo método de pago 'mercadopago'
--   - el pedido de MP reserva el cupo 2 hs mientras la persona paga
--   - mp_registrar_pago(): la llama SOLO la Edge Function del webhook (service_role)
-- =============================================================

alter type public.metodo_pago add value if not exists 'mercadopago';

alter table public.pedidos add column if not exists mp_preference_id text;
alter table public.pedidos add column if not exists mp_payment_id text;
alter table public.pedidos add column if not exists mp_status text;

-- Los pedidos de Mercado Pago reservan el cupo 2 hs (los de transferencia, 48 hs).
create or replace function public.t_pedido_vence_mp()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.metodo_pago::text = 'mercadopago' and new.estado = 'pendiente' then
    new.vence_at := now() + interval '2 hours';
  end if;
  return new;
end; $$;
drop trigger if exists pedido_vence_mp on public.pedidos;
create trigger pedido_vence_mp before insert on public.pedidos
  for each row execute function public.t_pedido_vence_mp();

-- Resultado de un pago de MP (lo llama la Edge Function mp-webhook con la service role).
create or replace function public.mp_registrar_pago(p_pedido_id uuid, p_payment_id text, p_status text, p_monto numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  select * into v from public.pedidos where id = p_pedido_id for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'pedido inexistente'); end if;

  update public.pedidos set mp_payment_id = p_payment_id, mp_status = p_status where id = v.id;

  if p_status = 'approved' and v.estado not in ('pagado', 'cancelado') then
    if p_monto < v.total then
      update public.pedidos set notas = concat_ws(E'\n', notas, format('MP %s aprobado por $%s pero el total es $%s: revisar', p_payment_id, p_monto, v.total))
      where id = v.id;
      return jsonb_build_object('ok', false, 'motivo', 'monto menor');
    end if;
    update public.pedidos
    set estado = 'pagado', validado_at = now(), vence_at = null,
        notas = concat_ws(E'\n', notas, 'Pagado con Mercado Pago · operación ' || p_payment_id)
    where id = v.id;
    update public.entradas set activa = true where pedido_id = v.id;
    return jsonb_build_object('ok', true, 'pagado', true);
  end if;
  return jsonb_build_object('ok', true, 'pagado', v.estado = 'pagado');
end; $$;
revoke execute on function public.mp_registrar_pago(uuid, text, text, numeric) from public, anon, authenticated;
grant execute on function public.mp_registrar_pago(uuid, text, text, numeric) to service_role;

-- Mails: un pedido de MP recién creado todavía no está pagado; el mail sale cuando se aprueba.
create or replace function public.t_notif_pedido()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; v_evento text;
begin
  select * into v from public.pedidos where id = new.id;
  if not found then return null; end if;
  v_evento := case when tg_op = 'INSERT' then 'pedido_nuevo' else 'pedido_' || v.estado::text end;
  if v_evento not in ('pedido_nuevo', 'pedido_comprobante_enviado', 'pedido_pagado', 'pedido_rechazado') then
    return null;
  end if;
  if v_evento = 'pedido_nuevo' and v.metodo_pago::text = 'mercadopago' then
    return null;
  end if;
  perform public.notificar(v_evento, public.ver_pedido(v.token) || jsonb_build_object(
    'email', v.email, 'whatsapp', v.whatsapp, 'instagram', v.instagram, 'canal', v.canal,
    'regalo_mensaje', v.regalo_mensaje));
  return null;
end; $$;

-- Opción visible en la web solo cuando se habilite en Configuración → Ventas
update public.config set valor = valor || '{"mercadopago": false}'::jsonb where clave = 'ventas' and not (valor ? 'mercadopago');
