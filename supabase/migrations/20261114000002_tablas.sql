-- =============================================================
-- 0002 · Tablas: ventas, marcas, bolsa, contenido y desafío
-- =============================================================

-- ---------- Entradas y pedidos ----------
create table public.tipos_entrada (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  descripcion      text,
  precio           integer not null check (precio >= 0),         -- ARS enteros
  cupo             integer check (cupo is null or cupo >= 0),     -- null = sin tope
  incluye_almuerzo boolean not null default false,
  incluye_festival boolean not null default true,
  valor_canje      integer not null default 0 check (valor_canje >= 0),
  venta_online     boolean not null default true,
  activo           boolean not null default true,
  orden            integer not null default 0
);

create table public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,
  token            text not null unique default public.gen_token(),
  tipo             public.pedido_tipo not null,
  nombre           text not null,
  email            text,
  whatsapp         text,
  total            integer not null check (total >= 0),
  metodo_pago      public.metodo_pago not null,
  canal            public.canal_venta not null default 'online',
  estado           public.pedido_estado not null default 'pendiente',
  comprobante_path text,
  comprobante_at   timestamptz,
  vence_at         timestamptz,
  es_regalo        boolean not null default false,
  regalo_para      text,
  regalo_mensaje   text,
  entrega          public.entrega_tipo,
  entregado        boolean not null default false,
  entregado_at     timestamptz,
  notas            text,
  validado_por     uuid references auth.users (id),
  validado_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index pedidos_estado_idx on public.pedidos (estado);

create table public.pedido_items (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references public.pedidos (id) on delete cascade,
  item_tipo   public.item_tipo not null,
  item_id     uuid not null,
  nombre      text not null,          -- copia del nombre al momento de la compra
  marca_id    uuid,                   -- para productos: a quién se le liquida
  cantidad    integer not null check (cantidad > 0),
  precio_unit integer not null check (precio_unit >= 0)
);
create index pedido_items_pedido_idx on public.pedido_items (pedido_id);

create table public.entradas (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos (id) on delete cascade,
  tipo_entrada_id uuid not null references public.tipos_entrada (id),
  titular_nombre  text not null,
  token           text not null unique default public.gen_token(),
  codigo_corto    text not null unique,
  activa          boolean not null default false,
  ingreso_at      timestamptz,
  ingreso_por     text,
  almuerzo_at     timestamptz,
  almuerzo_por    text,
  created_at      timestamptz not null default now()
);
create index entradas_pedido_idx on public.entradas (pedido_id);
create index entradas_tipo_idx on public.entradas (tipo_entrada_id);

-- ---------- Marcas, productos y puestos ----------
create table public.marcas (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  slug               text not null unique,
  tipo               public.marca_tipo not null default 'feriante',
  rubro              text,
  descripcion        text,
  logo_path          text,
  instagram          text,
  whatsapp           text,
  web                text,
  estado             public.marca_estado not null default 'postulada',
  en_guia_regalos    boolean not null default false,
  participa_festival boolean not null default false,
  orden              integer not null default 0,
  -- privados (solo panel)
  contacto_interno   text,
  notas_internas     text,
  created_at         timestamptz not null default now()
);

create table public.productos (
  id                uuid primary key default gen_random_uuid(),
  marca_id          uuid not null references public.marcas (id) on delete cascade,
  nombre            text not null,
  descripcion       text,
  precio            integer check (precio is null or precio >= 0),
  foto_path         text,
  disp_previa       boolean not null default true,
  disp_festival     boolean not null default true,
  disp_post         boolean not null default true,
  agregable_a_bolsa boolean not null default false,
  activo            boolean not null default true,
  orden             integer not null default 0
);
create index productos_marca_idx on public.productos (marca_id);

create table public.puestos (
  id                 uuid primary key default gen_random_uuid(),
  marca_id           uuid references public.marcas (id) on delete set null,
  nombre             text not null,
  slug               text not null unique,
  pin_hash           text,
  cupo_canjes        integer check (cupo_canjes is null or cupo_canjes >= 0),  -- null = sin tope
  ubicacion          text,
  activo             boolean not null default true,
  intentos_fallidos  integer not null default 0,
  bloqueado_hasta    timestamptz,
  created_at         timestamptz not null default now()
);

create table public.puesto_sesiones (
  token      text primary key default public.gen_token(),
  puesto_id  uuid not null references public.puestos (id) on delete cascade,
  expira_at  timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);

create table public.canjes (
  id         uuid primary key default gen_random_uuid(),
  entrada_id uuid not null unique references public.entradas (id) on delete cascade,  -- un QR, un canje
  puesto_id  uuid not null references public.puestos (id),
  detalle    text,
  created_at timestamptz not null default now()
);
create index canjes_puesto_idx on public.canjes (puesto_id);

create table public.liquidaciones (
  puesto_id            uuid primary key references public.puestos (id) on delete cascade,
  porcentaje_retencion numeric(5,2) not null default 0 check (porcentaje_retencion between 0 and 100),
  pagado               boolean not null default false,
  pagado_at            timestamptz,
  notas                text
);

-- ---------- Bolsas ----------
create table public.bolsas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text not null unique,
  descripcion text,
  precio_base integer not null check (precio_base >= 0),
  foto_path   text,
  activo      boolean not null default true,
  orden       integer not null default 0
);

create table public.bolsa_items_base (
  bolsa_id    uuid not null references public.bolsas (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete cascade,
  cantidad    integer not null default 1 check (cantidad > 0),
  primary key (bolsa_id, producto_id)
);

-- ---------- Contenido ----------
create table public.actividades (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  marca_id    uuid references public.marcas (id) on delete set null,
  inicio      timestamptz not null,
  fin         timestamptz,
  espacio     text,
  categoria   text,
  franja      public.franja_tipo not null default 'tarde',
  imagen_path text,
  publicado   boolean not null default false
);

create table public.avisos (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null,
  destacado  boolean not null default false,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Desafío 21 días ----------
create table public.desafio_dias (
  dia         integer primary key check (dia between 1 and 21),
  fecha       date not null,
  titulo      text,
  descripcion text,
  youtube_url text,
  publicado   boolean not null default false
);

create table public.desafio_inscripciones (
  id                     uuid primary key default gen_random_uuid(),
  nombre                 text not null,
  email                  text not null,
  whatsapp               text,
  ciudad                 text,
  como_se_entero         text,
  acepta_comunicaciones  boolean not null,
  token                  text not null unique default public.gen_token(),
  created_at             timestamptz not null default now()
);
create unique index desafio_inscripciones_email_idx on public.desafio_inscripciones (lower(email));

create table public.desafio_checks (
  inscripcion_id uuid not null references public.desafio_inscripciones (id) on delete cascade,
  dia            integer not null references public.desafio_dias (dia),
  created_at     timestamptz not null default now(),
  primary key (inscripcion_id, dia)
);

-- ---------- Códigos únicos (MIC-XXXX compartido entre pedidos y entradas) ----------
create or replace function public.gen_codigo()
returns text
language plpgsql volatile
set search_path = ''
as $$
declare c text;
begin
  loop
    c := public.gen_codigo_raw();
    exit when not exists (select 1 from public.pedidos where codigo = c)
          and not exists (select 1 from public.entradas where codigo_corto = c);
  end loop;
  return c;
end;
$$;

alter table public.pedidos  alter column codigo       set default public.gen_codigo();
alter table public.entradas alter column codigo_corto set default public.gen_codigo();
