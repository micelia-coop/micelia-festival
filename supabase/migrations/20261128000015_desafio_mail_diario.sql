-- =============================================================
-- 0015 · Mail diario del Desafío (lo manda el Apps Script a las 6 am)
--   El script llama a estas funciones con la clave secreta compartida.
-- =============================================================

alter table public.desafio_inscripciones add column if not exists baja boolean not null default false;

create table if not exists public.desafio_mails (
  inscripcion_id uuid not null references public.desafio_inscripciones (id) on delete cascade,
  dia            integer not null,
  enviado_at     timestamptz not null default now(),
  primary key (inscripcion_id, dia)
);
alter table public.desafio_mails enable row level security;
revoke all on public.desafio_mails from anon, authenticated;

-- El equipo del Desafío puede dar de baja (o volver a dar de alta) a una inscripta.
drop policy if exists inscripciones_baja on public.desafio_inscripciones;
create policy inscripciones_baja on public.desafio_inscripciones for update to authenticated
  using ((select public.tiene_rol('desafio'))) with check ((select public.tiene_rol('desafio')));

create or replace function public.secreto_valido(p_secreto text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from privado.ajustes where clave = 'apps_script_secreto' and valor = p_secreto);
$$;

-- Día habilitado HOY (publicado, con video y con fecha de hoy) + inscriptas que todavía no recibieron el mail.
create or replace function public.desafio_pendientes_hoy(p_secreto text, p_limite int default 90)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d public.desafio_dias;
begin
  if not public.secreto_valido(p_secreto) then raise exception 'no autorizado' using errcode = '42501'; end if;
  select * into d from public.desafio_dias
  where publicado and fecha = public.ahora_mendoza()::date and nullif(trim(coalesce(youtube_url, '')), '') is not null
  order by dia limit 1;
  return jsonb_build_object(
    'total_inscriptas', (select count(*) from public.desafio_inscripciones),
    'dia', case when d.dia is null then null else jsonb_build_object('dia', d.dia, 'titulo', d.titulo, 'descripcion', d.descripcion, 'fecha', d.fecha) end,
    'pendientes', case when d.dia is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'nombre', i.nombre, 'email', i.email))
      from (select i.id, i.nombre, i.email from public.desafio_inscripciones i
            where not i.baja and i.acepta_comunicaciones
              and not exists (select 1 from public.desafio_mails m where m.inscripcion_id = i.id and m.dia = d.dia)
            order by i.created_at limit greatest(p_limite, 0)) i), '[]'::jsonb) end);
end; $$;

create or replace function public.desafio_marcar_enviados(p_secreto text, p_dia int, p_ids uuid[])
returns integer language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not public.secreto_valido(p_secreto) then raise exception 'no autorizado' using errcode = '42501'; end if;
  insert into public.desafio_mails (inscripcion_id, dia)
  select unnest(p_ids), p_dia on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end; $$;

revoke execute on function public.secreto_valido(text) from public, anon, authenticated;
grant execute on function public.desafio_pendientes_hoy(text, int) to anon;
grant execute on function public.desafio_marcar_enviados(text, int, uuid[]) to anon;
