-- =============================================================
-- 0006 · Datos iniciales (todo lo marcado "a confirmar" se edita desde el panel)
-- =============================================================

insert into public.config (clave, valor, publico) values
('festival', jsonb_build_object(
   'nombre', 'Festival de Solsticio',
   'organiza', 'Micelia Cooperativa',
   'fecha', '2026-12-19',
   'inicio_manana', '2026-12-19T08:00:00-03:00',
   'inicio_tarde', '2026-12-19T13:00:00-03:00',
   'lugar', null,
   'lugar_direccion', null,
   'lugar_maps_url', null,
   'bajada', 'Un día para celebrar el solsticio en comunidad: yoga, comida compartida, marcas emprendedoras y ritual.',
   'telegram_url', null,
   'instagram_url', 'https://instagram.com/',
   'whatsapp_contacto', null
 ), true),
('pago', jsonb_build_object(
   'billetera', 'Personal Pay',
   'alias', null,
   'cvu', null,
   'titular', null
 ), true),
('ventas', jsonb_build_object(
   'entradas_abiertas', false,
   'bolsas_abiertas', false,
   'mensaje_cerrado', 'La venta abre muy pronto. Seguinos en Instagram y Telegram para enterarte primera.'
 ), true),
('canje', jsonb_build_object(
   'fecha', '2026-12-19',
   'desde', '13:00',
   'hasta', '21:00'
 ), true),
('desafio', jsonb_build_object(
   'titulo', 'Desafío de Gratitud · 21 días',
   'bajada', 'Durante 21 días, un video corto por día para practicar la gratitud. Gratis, online, a tu ritmo.',
   'gestiona', 'Respira y Transfórmate',
   'consentimiento', 'Acepto que Respira y Transfórmate y Micelia Cooperativa usen mis datos para enviarme información del desafío y del festival. Puedo pedir la baja cuando quiera.'
 ), true),
('bolsa', jsonb_build_object(
   'direccion_petruca', 'Local de Petruca · calle Espejo, Ciudad de Mendoza'
 ), true),
('faq', jsonb_build_array(
   jsonb_build_object('p', '¿Cómo funciona el canje de la entrada de la tarde?',
     'r', 'Tu entrada de la tarde es 100% canjeable: la cambiás entera, en un solo puesto, por un producto, servicio, actividad o consumición. Si lo que elegís cuesta más, pagás la diferencia directo al puesto. Cada puesto tiene un cupo de canjes, así que no lo dejes para último momento.'),
   jsonb_build_object('p', '¿La entrada de la mañana se canjea?',
     'r', 'No. La entrada de la mañana paga la práctica de yoga y el almuerzo de La Tregua, e incluye el acceso al festival de la tarde, pero no tiene crédito de canje.'),
   jsonb_build_object('p', '¿Necesito imprimir algo?',
     'r', 'No. Es un festival cero papel: tu entrada vive en tu celular. Guardá el link o hacé una captura del QR.'),
   jsonb_build_object('p', '¿Cómo pago?',
     'r', 'Por transferencia al alias de Micelia (subís el comprobante y lo validamos) o reservando para pagar en efectivo. Las reservas en efectivo vencen a las 48 hs si no se pagan.'),
   jsonb_build_object('p', '¿Puedo llevar mate?',
     'r', '¡Sí! Traé tu equipo de mate.'),
   jsonb_build_object('p', '¿Dónde es?',
     'r', 'El lugar se confirma muy pronto. Lo vas a ver en esta página y en nuestras redes.'),
   jsonb_build_object('p', 'Accesibilidad',
     'r', 'Si necesitás alguna adaptación para disfrutar el festival, escribinos y lo vemos juntas.')
 ), true);

-- Tipos de entrada
insert into public.tipos_entrada (id, nombre, descripcion, precio, cupo, incluye_almuerzo, incluye_festival, valor_canje, orden) values
('00000000-0000-4000-8000-000000000001', 'Mañana completa',
 'Yoga con Respira y Transfórmate + almuerzo de La Tregua (bebida + tapeo) + acceso al festival de la tarde. De 8 a 12 hs.',
 25000, 20, true, true, 0, 1),
('00000000-0000-4000-8000-000000000002', 'Solo tarde',
 'Acceso al festival desde las 13 hs. Tu entrada es 100% canjeable en un puesto. Valor a confirmar.',
 5155, null, false, true, 5155, 2);

-- Desafío: 21 días desde el 28/11 (sin publicar)
insert into public.desafio_dias (dia, fecha, titulo, publicado)
select d, date '2026-11-28' + (d - 1), 'Día ' || d, false
from generate_series(1, 21) d;

-- Marcas de ejemplo
insert into public.marcas (id, nombre, slug, tipo, rubro, descripcion, instagram, estado, en_guia_regalos, participa_festival, orden) values
('00000000-0000-4000-8000-0000000000a1', 'Micelia', 'micelia', 'micelia', 'Cooperativa',
 'Cooperativa de marcas emprendedoras de Mendoza.', 'https://instagram.com/', 'confirmada', true, true, 0),
('00000000-0000-4000-8000-0000000000a2', 'Petruca', 'petruca', 'alianza', 'Tienda',
 'Aliada de la Bolsa Ritual. Punto de retiro en calle Espejo, Ciudad de Mendoza. (Ficha a confirmar)', null, 'confirmada', true, true, 1),
('00000000-0000-4000-8000-0000000000a3', 'La Tregua', 'la-tregua', 'gastronomia', 'Gastronomía',
 'Almuerzo de la mañana y comida durante la tarde. (Ficha a confirmar)', null, 'confirmada', true, true, 2),
('00000000-0000-4000-8000-0000000000a4', 'Respira y Transfórmate', 'respira-y-transformate', 'alianza', 'Bienestar',
 'Yoga y Desafío de Gratitud de 21 días. (Ficha a confirmar)', null, 'confirmada', false, true, 3);

-- Productos de ejemplo (a confirmar)
insert into public.productos (id, marca_id, nombre, descripcion, precio, agregable_a_bolsa, orden) values
('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'Producto base 1', 'A confirmar', null, false, 1),
('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a1', 'Producto base 2', 'A confirmar', null, false, 2),
('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000a2', 'Producto base 3', 'A confirmar', null, false, 3),
('00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-0000000000a2', 'Producto base 4', 'A confirmar', null, false, 4),
('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000a2', 'Producto base 5', 'A confirmar', null, false, 5),
('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a2', 'Extra de ejemplo: vela de soja', 'Ejemplo para probar el configurador', 6500, true, 10),
('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a1', 'Extra de ejemplo: sahumo artesanal', 'Ejemplo para probar el configurador', 4000, true, 11);

-- Bolsa Ritual
insert into public.bolsas (id, nombre, slug, descripcion, precio_base, orden) values
('00000000-0000-4000-8000-0000000000d1', 'Bolsa Ritual Micelia × Petruca', 'bolsa-ritual',
 'Una bolsa con 5 productos de marcas emprendedoras para regalar (o regalarte) en estas fiestas. Productos y precio a confirmar.',
 30000, 1);

insert into public.bolsa_items_base (bolsa_id, producto_id, cantidad)
select '00000000-0000-4000-8000-0000000000d1', id, 1 from public.productos
where id in ('00000000-0000-4000-8000-0000000000b1','00000000-0000-4000-8000-0000000000b2',
             '00000000-0000-4000-8000-0000000000b3','00000000-0000-4000-8000-0000000000b4',
             '00000000-0000-4000-8000-0000000000b5');

-- Aviso de ejemplo
insert into public.avisos (texto, destacado, activo) values
('Muy pronto abrimos la venta de entradas. ¡Sumate al Desafío de Gratitud mientras tanto!', true, true);
