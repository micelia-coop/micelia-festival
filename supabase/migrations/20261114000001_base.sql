-- =============================================================
-- 0001 · Base: extensiones, tipos, config, perfiles y helpers
-- =============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tipos ----------
create type public.rol_guardiana as enum ('admin', 'alianzas', 'desafio', 'puerta', 'tregua');
create type public.pedido_tipo   as enum ('entrada', 'bolsa');
create type public.metodo_pago   as enum ('transferencia', 'efectivo');
create type public.canal_venta   as enum ('online', 'puerta');
create type public.pedido_estado as enum ('pendiente', 'comprobante_enviado', 'pagado', 'rechazado', 'vencido', 'cancelado');
create type public.entrega_tipo  as enum ('retiro_petruca', 'retiro_festival');
create type public.item_tipo     as enum ('tipo_entrada', 'bolsa', 'producto');
create type public.marca_tipo    as enum ('guardiana', 'feriante', 'invitada', 'micelia', 'gastronomia', 'alianza');
create type public.marca_estado  as enum ('postulada', 'confirmada', 'rechazada');
create type public.franja_tipo   as enum ('manana', 'tarde');

-- ---------- Config (clave/valor) ----------
create table public.config (
  clave      text primary key,
  valor      jsonb not null default '{}'::jsonb,
  publico    boolean not null default true,   -- false = solo panel
  updated_at timestamptz not null default now()
);

-- ---------- Perfiles de guardianas ----------
create table public.perfiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null,
  email      text,
  roles      public.rol_guardiana[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Helpers de roles ----------
-- admin tiene todos los permisos.
create or replace function public.tiene_rol(r public.rol_guardiana)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p
    where p.user_id = auth.uid()
      and (r = any (p.roles) or 'admin' = any (p.roles))
  );
$$;

create or replace function public.es_guardiana()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.perfiles p where p.user_id = auth.uid() and cardinality(p.roles) > 0);
$$;

-- ---------- Generadores de códigos ----------
-- Token largo y aleatorio para links personales (24 caracteres url-safe, 144 bits).
create or replace function public.gen_token()
returns text
language sql volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
$$;

-- Código corto legible: MIC-XXXX (sin 0/O/1/I/L para que no se confundan al tipear).
create or replace function public.gen_codigo_raw()
returns text
language plpgsql volatile
set search_path = ''
as $$
declare
  alfabeto constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(4);
  res text := 'MIC-';
  i int;
begin
  for i in 0..3 loop
    res := res || substr(alfabeto, (get_byte(bytes, i) % length(alfabeto)) + 1, 1);
  end loop;
  return res;
end;
$$;

-- updated_at automático
create or replace function public.tocar_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

create trigger config_updated before update on public.config
  for each row execute function public.tocar_updated_at();

-- Hora local del festival
create or replace function public.ahora_mendoza()
returns timestamp
language sql stable
set search_path = ''
as $$ select (now() at time zone 'America/Argentina/Mendoza'); $$;
