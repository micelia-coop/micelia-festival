-- =============================================================
-- 0005 · Storage: buckets y políticas
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('comprobantes', 'comprobantes', false, 8388608, array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']),
  ('marcas',       'marcas',       true,  5242880, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('productos',    'productos',    true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('festival',     'festival',     true,  8388608, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Comprobantes: el público solo puede SUBIR, y solo dentro de la carpeta {token del pedido}/
create policy comprobantes_subir on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'comprobantes'
    and public.pedido_acepta_comprobante((storage.foldername(name))[1])
  );
-- Solo admin los ve.
create policy comprobantes_ver on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and public.tiene_rol('admin'));

-- Imágenes públicas: lectura libre (bucket público); escritura para admin/alianzas.
create policy imagenes_escribir on storage.objects for insert to authenticated
  with check (bucket_id in ('marcas', 'productos', 'festival')
              and (public.tiene_rol('alianzas') or public.tiene_rol('admin')));
create policy imagenes_editar on storage.objects for update to authenticated
  using (bucket_id in ('marcas', 'productos', 'festival')
         and (public.tiene_rol('alianzas') or public.tiene_rol('admin')));
create policy imagenes_borrar on storage.objects for delete to authenticated
  using (bucket_id in ('marcas', 'productos', 'festival')
         and (public.tiene_rol('alianzas') or public.tiene_rol('admin')));
