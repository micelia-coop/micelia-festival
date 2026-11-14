-- =============================================================
-- 0003 · Seguridad: RLS en todas las tablas
--   anon          = visitantes del sitio (solo lee lo publicado/activo)
--   authenticated = guardianas logueadas (permisos según perfiles.roles)
--   Las escrituras públicas pasan por funciones RPC (security definer).
-- =============================================================

alter table public.config                enable row level security;
alter table public.perfiles              enable row level security;
alter table public.tipos_entrada         enable row level security;
alter table public.pedidos               enable row level security;
alter table public.pedido_items          enable row level security;
alter table public.entradas              enable row level security;
alter table public.marcas                enable row level security;
alter table public.productos             enable row level security;
alter table public.puestos               enable row level security;
alter table public.puesto_sesiones       enable row level security;
alter table public.canjes                enable row level security;
alter table public.liquidaciones         enable row level security;
alter table public.bolsas                enable row level security;
alter table public.bolsa_items_base      enable row level security;
alter table public.actividades           enable row level security;
alter table public.avisos                enable row level security;
alter table public.desafio_dias          enable row level security;
alter table public.desafio_inscripciones enable row level security;
alter table public.desafio_checks        enable row level security;

-- Por defecto, el público no escribe nada directo.
revoke insert, update, delete, truncate on all tables in schema public from anon;

-- ---------- config ----------
create policy config_leer_publico on public.config for select to anon, authenticated
  using (publico or (select public.es_guardiana()));
create policy config_admin on public.config for all to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- ---------- perfiles ----------
create policy perfiles_propio on public.perfiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.tiene_rol('admin')));
create policy perfiles_admin on public.perfiles for all to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- ---------- tipos_entrada ----------
create policy tipos_leer on public.tipos_entrada for select to anon, authenticated
  using (activo or (select public.es_guardiana()));
create policy tipos_admin on public.tipos_entrada for all to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- ---------- pedidos / items / entradas (datos personales) ----------
create policy pedidos_leer on public.pedidos for select to authenticated
  using ((select public.tiene_rol('puerta')) or (select public.tiene_rol('alianzas')));
create policy pedidos_admin on public.pedidos for update to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

create policy items_leer on public.pedido_items for select to authenticated
  using ((select public.tiene_rol('puerta')) or (select public.tiene_rol('alianzas')));

create policy entradas_leer on public.entradas for select to authenticated
  using ((select public.tiene_rol('puerta')) or (select public.tiene_rol('tregua')));

-- ---------- marcas ----------
-- El público solo ve marcas confirmadas y nunca las columnas internas.
revoke select on public.marcas from anon;
grant select (id, nombre, slug, tipo, rubro, descripcion, logo_path, instagram, whatsapp, web,
              estado, en_guia_regalos, participa_festival, orden, created_at)
  on public.marcas to anon;

create policy marcas_leer_publico on public.marcas for select to anon
  using (estado = 'confirmada' and (en_guia_regalos or participa_festival));
create policy marcas_leer_panel on public.marcas for select to authenticated
  using ((select public.es_guardiana()) or (estado = 'confirmada' and (en_guia_regalos or participa_festival)));
create policy marcas_alianzas on public.marcas for all to authenticated
  using ((select public.tiene_rol('alianzas'))) with check ((select public.tiene_rol('alianzas')));

-- ---------- productos ----------
create policy productos_leer on public.productos for select to anon, authenticated
  using (
    (activo and exists (select 1 from public.marcas m where m.id = marca_id and m.estado = 'confirmada'))
    or (select public.es_guardiana())
  );
create policy productos_alianzas on public.productos for all to authenticated
  using ((select public.tiene_rol('alianzas'))) with check ((select public.tiene_rol('alianzas')));

-- ---------- puestos / canjes / liquidaciones ----------
create policy puestos_alianzas on public.puestos for all to authenticated
  using ((select public.tiene_rol('alianzas'))) with check ((select public.tiene_rol('alianzas')));
-- El hash del PIN no se expone ni siquiera al panel (se lee todo menos pin_hash).
revoke select on public.puestos from anon, authenticated;
grant select (id, marca_id, nombre, slug, cupo_canjes, ubicacion, activo, intentos_fallidos,
              bloqueado_hasta, created_at)
  on public.puestos to authenticated;
revoke all on public.puesto_sesiones from anon, authenticated;

-- puesto_sesiones: sin políticas → solo accesible desde funciones security definer.

create policy canjes_leer on public.canjes for select to authenticated
  using ((select public.tiene_rol('alianzas')));

create policy liquidaciones_admin on public.liquidaciones for all to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- ---------- bolsas ----------
create policy bolsas_leer on public.bolsas for select to anon, authenticated
  using (activo or (select public.es_guardiana()));
create policy bolsas_alianzas on public.bolsas for all to authenticated
  using ((select public.tiene_rol('alianzas'))) with check ((select public.tiene_rol('alianzas')));

create policy bolsa_items_leer on public.bolsa_items_base for select to anon, authenticated using (true);
create policy bolsa_items_alianzas on public.bolsa_items_base for all to authenticated
  using ((select public.tiene_rol('alianzas'))) with check ((select public.tiene_rol('alianzas')));

-- ---------- actividades / avisos ----------
create policy actividades_leer on public.actividades for select to anon, authenticated
  using (publicado or (select public.es_guardiana()));
create policy actividades_admin on public.actividades for all to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

create policy avisos_leer on public.avisos for select to anon, authenticated
  using (activo or (select public.es_guardiana()));
create policy avisos_admin on public.avisos for all to authenticated
  using ((select public.tiene_rol('admin'))) with check ((select public.tiene_rol('admin')));

-- ---------- desafío ----------
-- El público ve la grilla vía la función desafio_grilla() (oculta videos futuros).
create policy dias_desafio on public.desafio_dias for all to authenticated
  using ((select public.tiene_rol('desafio'))) with check ((select public.tiene_rol('desafio')));

create policy inscripciones_leer on public.desafio_inscripciones for select to authenticated
  using ((select public.tiene_rol('desafio')));
create policy inscripciones_borrar on public.desafio_inscripciones for delete to authenticated
  using ((select public.tiene_rol('desafio')));

create policy checks_leer on public.desafio_checks for select to authenticated
  using ((select public.tiene_rol('desafio')));
