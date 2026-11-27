-- =============================================================
-- 0011 · Alianzas puede editar los textos de la propuesta (config 'propuesta')
-- =============================================================
drop policy if exists config_propuesta_alianzas on public.config;
create policy config_propuesta_alianzas on public.config for all to authenticated
  using (clave = 'propuesta' and (select public.tiene_rol('alianzas')))
  with check (clave = 'propuesta' and (select public.tiene_rol('alianzas')));
