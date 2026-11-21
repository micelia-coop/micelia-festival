-- =============================================================
-- 0009 · Notificaciones por mail (desde el Gmail de Micelia vía Google Apps Script)
--   La base avisa a un Apps Script con una clave secreta; el script manda:
--   - el mail de confirmación a la persona (si dejó email)
--   - un aviso a la casilla de Micelia
--   El envío es asíncrono (pg_net): no frena ni rompe inscripciones o compras.
-- =============================================================

create extension if not exists pg_net;

-- Ajustes privados: NO se exponen por la API (schema fuera de "public").
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
create table if not exists privado.ajustes (clave text primary key, valor text not null);
revoke all on privado.ajustes from public, anon, authenticated;

-- Clave secreta compartida con el Apps Script (se genera una sola vez).
insert into privado.ajustes (clave, valor) values ('apps_script_secreto', public.gen_token() || public.gen_token())
on conflict (clave) do nothing;

create or replace function public.notificar(p_evento text, p_datos jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secreto text;
begin
  select valor into v_url from privado.ajustes where clave = 'apps_script_url';
  select valor into v_secreto from privado.ajustes where clave = 'apps_script_secreto';
  if v_url is null or v_secreto is null then return; end if;   -- todavía no configurado
  begin
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('secreto', v_secreto, 'evento', p_evento, 'datos', p_datos),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 15000);
  exception when others then
    raise warning 'notificar(%): %', p_evento, sqlerrm;   -- nunca rompe la operación principal
  end;
end; $$;

-- ---------- Desafío ----------
create or replace function public.t_notif_desafio()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notificar('desafio_inscripcion', jsonb_build_object(
    'nombre', new.nombre, 'email', new.email, 'whatsapp', new.whatsapp, 'instagram', new.instagram,
    'ciudad', new.ciudad, 'como_se_entero', new.como_se_entero,
    'total_inscriptas', (select count(*) from public.desafio_inscripciones)));
  return null;
end; $$;
drop trigger if exists notif_desafio on public.desafio_inscripciones;
create trigger notif_desafio after insert on public.desafio_inscripciones
  for each row execute function public.t_notif_desafio();

-- ---------- Marcas: postulación pública y registro privado ----------
create or replace function public.t_notif_marca_postulacion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notificar('marca_postulacion', jsonb_build_object(
    'nombre', new.nombre, 'rubro', new.rubro, 'descripcion', new.descripcion, 'instagram', new.instagram,
    'whatsapp', new.whatsapp, 'contacto', new.contacto_interno, 'mensaje', new.notas_internas));
  return null;
end; $$;
drop trigger if exists notif_marca_postulacion on public.marcas;
create trigger notif_marca_postulacion after insert on public.marcas
  for each row when (new.estado = 'postulada') execute function public.t_notif_marca_postulacion();

create or replace function public.t_notif_marca_registro()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notificar('marca_registro', jsonb_build_object(
    'nombre', new.nombre, 'rubro', new.rubro, 'instagram', new.instagram,
    'primera_vez', old.registro_completado_at is null,
    'contacto_nombre', new.registro_extra->>'contacto_nombre',
    'contacto_email', new.registro_extra->>'contacto_email',
    'contacto_whatsapp', new.registro_extra->>'contacto_whatsapp',
    'canje_oferta', new.registro_extra->>'canje_oferta',
    'necesidades', new.registro_extra->>'necesidades',
    'productos', (select count(*) from public.productos where marca_id = new.id),
    'registro_url', 'registro/' || new.registro_token));
  return null;
end; $$;
drop trigger if exists notif_marca_registro on public.marcas;
create trigger notif_marca_registro after update of registro_completado_at on public.marcas
  for each row when (new.registro_completado_at is distinct from old.registro_completado_at)
  execute function public.t_notif_marca_registro();

-- ---------- Pedidos (entradas y bolsas) ----------
-- Triggers diferidos: corren al confirmar la transacción, cuando el pedido ya tiene
-- total, ítems y entradas (y, al validar, las entradas ya están activas).
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
  perform public.notificar(v_evento, public.ver_pedido(v.token) || jsonb_build_object(
    'email', v.email, 'whatsapp', v.whatsapp, 'instagram', v.instagram, 'canal', v.canal,
    'regalo_mensaje', v.regalo_mensaje));
  return null;
end; $$;

drop trigger if exists notif_pedido_nuevo on public.pedidos;
create constraint trigger notif_pedido_nuevo after insert on public.pedidos
  deferrable initially deferred for each row execute function public.t_notif_pedido();

drop trigger if exists notif_pedido_estado on public.pedidos;
create constraint trigger notif_pedido_estado after update of estado on public.pedidos
  deferrable initially deferred for each row
  when (new.estado is distinct from old.estado and new.estado in ('comprobante_enviado', 'pagado', 'rechazado'))
  execute function public.t_notif_pedido();

-- Ninguna de estas funciones se llama desde la web.
revoke execute on function public.notificar(text, jsonb) from public, anon, authenticated;
