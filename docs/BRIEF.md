# Festival de Solsticio · Micelia — Brief del micrositio + Instructivo para Claude Code

> Versión 1.2 · 14/11/2026 · Documento vivo: lo marcado como **[PENDIENTE]** se completa a medida que se define.
> Uso: (1) referencia para las guardianas; (2) archivo que se le pasa a Claude Code para construir el sistema.

---

## PARTE 1 · El festival

### 1.1 Datos generales

| Dato | Valor |
|---|---|
| Nombre | Festival de Solsticio ✅ confirmado 14/11 |
| Organiza | Micelia Cooperativa |
| Fecha | Sábado 19 de diciembre de 2026 |
| Lugar | **[PENDIENTE]** — 2 opciones tentativas, ambas con wifi |
| Alianzas confirmadas | Respira y Transfórmate (desafío + yoga), La Tregua (almuerzo de la mañana + gastronomía de la tarde), Petruca (Bolsa Ritual + punto de retiro) |
| Canales | Micrositio + Instagram de Micelia + comunidad de Telegram |
| Principio | Cero papel: entradas y QR siempre en el celular |

### 1.2 Recorrido completo

```
Desde ~28/11 ──► DESAFÍO DE GRATITUD 21 DÍAS (online, gratis)
                    │  embudo hacia ▼
19/12 08–12 hs ──► MAÑANA: Yoga + almuerzo compartido (entrada paga, cupo 20)
                    │  incluye acceso a ▼
19/12 13 hs → ───► TARDE: Festival de Solsticio (entrada simbólica 100% canjeable)
                    │
Antes / durante / después ──► BOLSA RITUAL + GUÍA DE REGALOS CONSCIENTES (Navidad)
```

### 1.3 Desafío de Gratitud · 21 días
- Lo gestiona **Respira y Transfórmate**. Micelia lo sostiene y lo difunde.
- **Gratuito.** Funciona como embudo hacia la mañana de yoga y el festival.
- **Inscripción única** (nombre, email, WhatsApp, consentimiento). Con eso se arma una base de datos para hacer comunicación específica a quienes se sumaron.
- Los videos salen **día a día**: cada día tiene un video de YouTube que se carga y se publica en su fecha. Los días futuros se ven "bloqueados", con la fecha en que se habilitan.
- Opcional (si da el tiempo): cada inscripta recibe un link personal y puede marcar "día hecho", con una barra de progreso de 21 días.
- Fechas: si el día 21 es el 18/12, el día 1 es el **28/11**. **[PENDIENTE confirmar fecha de inicio]**

### 1.4 Mañana · Yoga + almuerzo (8 a 12 hs)
- Precio: **$25.000**. Cupo: **20 personas**.
- Incluye:
  - la práctica de yoga (Respira y Transfórmate);
  - un **vale de almuerzo de La Tregua** (1 bebida + tapeo, por ejemplo 2 empanadas);
  - el **acceso al festival de la tarde** sin volver a pagar.
- La Tregua necesita saber **cuántos almuerzos preparar**: ve el contador de entradas pagadas en tiempo real y valida cada vale escaneando el QR al entregar.
- La entrada de la mañana **NO es canjeable**: su valor paga la actividad de la mañana. Da acceso a la tarde, pero sin crédito de canje (`valor_canje = 0`). Solo la entrada de la tarde se canjea.

### 1.5 Tarde · Festival (desde las 13 hs)
- Entrada a valor simbólico, por ejemplo **$5.155**. **[PENDIENTE valor final y cupo según el lugar]**
- La entrada es **100% canjeable**: se canjea **entera en un solo lugar** por un producto, servicio, actividad o consumición (marcas aliadas, gastronomía, actividades o productos de Micelia).
- Si lo que la persona elige cuesta más, **paga la diferencia directo al puesto**.
- **Cupo de canjes por puesto: máximo 2** (configurable puesto por puesto).
- Participan marcas de guardianas, feriantes y marcas invitadas. Las marcas **no pagan stand** (en principio). A algunas se las invita por estrategia, para que convoquen a sus comunidades.
- **Gastronomía de la tarde:** además de los almuerzos de la mañana, **La Tregua vende comida durante la tarde** para quienes llegan al festival. Es un puesto más, donde también se puede canjear la entrada.
- Se puede llevar el equipo de mate (va en la FAQ).

> ⚠️ **Regla de capacidad que hay que cuidar:** la suma de cupos de canje de todos los puestos tiene que ser **igual o mayor** que la cantidad de entradas vendidas. Si no, alguien pagó una entrada "100% canjeable" y no tiene dónde canjearla.
> Ejemplo: 15 marcas × 2 = 30 canjes. Si se venden 60 entradas, faltan 30 lugares.
> Solución: los puestos propios de Micelia (Bolsa Ritual, gastronomía de La Tregua, actividades) **sin tope**, más alertas en el panel cuando la capacidad se acerque al límite.

### 1.6 Bolsa Ritual (producto propio de Micelia, en alianza con Petruca)
- **Un solo modelo: la Bolsa Ritual Micelia × Petruca**, con 5 productos base y un precio base. **[PENDIENTE productos y precio]**
- Funciona como un mini e-commerce:
  - se ve la bolsa con sus 5 productos base;
  - se le **agregan productos extra** de otras marcas (guardianas y marcas que Micelia elija sumar), con el total sumándose en vivo;
  - se marca si es **para regalar** (nombre de quien la recibe y un mensaje para la tarjeta);
  - forma de entrega:
    - **retiro en el local de Petruca** (calle Espejo, Ciudad de Mendoza);
    - **retiro el día del festival**.
- Se vende antes, durante y después del festival. Hay que empujarla en la previa.
- Como los extras son productos de otras marcas cobrados por Micelia, el sistema registra cuánto se vendió de cada marca para pagarle después. **[PENDIENTE: acordar con las marcas el precio, si hay % para Micelia y cómo se reponen los productos para armar las bolsas]**

### 1.7 Guía de regalos conscientes (Navidad)
- Todas las marcas participantes quedan publicadas con su ficha, sus productos, sus precios y su contacto (WhatsApp / Instagram / web).
- Objetivo: fomentar el consumo consciente de marcas emprendedoras como regalo de fiestas, **antes, durante y sobre todo después** del festival.
- La compra suelta de productos de otras marcas es **directa con cada marca** (botón "Pedir por WhatsApp"). Por el sistema de Micelia solo se compran las entradas y la Bolsa Ritual (con sus extras).
- Después del 19/12, el sitio queda como vidriera de regalos hasta fin de año.

### 1.8 Cobros
Se cobra con la cuenta de **Personal Pay** de Micelia: transferencias a su alias/CVU. No tiene (que sepamos) un sistema de cobro integrable a una web, así que la validación es manual. Las opciones quedan **abiertas antes y el mismo día**:

| Cuándo | Método | Cómo funciona |
|---|---|---|
| **Antes del festival** (online) | Transferencia | El sitio muestra alias, titular, monto y un código de pedido para la referencia. La persona sube el comprobante y una admin lo valida en el panel. Recién ahí se activa el QR. |
| **Antes del festival** (online) | Reserva para pagar en efectivo | La persona reserva online y paga en efectivo en la puerta (o a una guardiana antes). La reserva vence a las 48 hs si no se paga, para liberar el cupo de la mañana. |
| **El día del festival** (en la puerta) | Transferencia | La guardiana de puerta carga nombre y WhatsApp en el modo puerta, la persona transfiere al alias en el momento, la guardiana ve la acreditación en la app de Personal Pay y marca "pagado". El QR aparece en la pantalla y se envía por WhatsApp. |
| **El día del festival** (en la puerta) | Efectivo | Igual que la anterior, pero cobrando en efectivo. El panel lleva el total de efectivo recibido para el arqueo de caja. |

- En la puerta, la mañana solo se puede comprar si quedan lugares del cupo de 20.

- Cuando una admin valida el pago, el panel ofrece un botón **"Enviar entrada por WhatsApp"** con el link de la entrada ya escrito. Así no hace falta un servicio de email. El email automático queda como mejora opcional.
- ⚠️ Conviene consultar con la contadora si es correcto recibir estos cobros en una cuenta personal mientras la cooperativa está en formación.

### 1.9 Roles y quién actualiza qué

| Rol | Quiénes | Puede |
|---|---|---|
| **Admin general** | Jess (Gobernanza), Estefi (Comunicación) | Todo: contenidos, cronograma, avisos, validar pagos, ver ventas, canjes y liquidación, configurar el festival |
| **Alianzas** | Vanesa (Alianzas) | Marcas: alta, edición, postulaciones, productos, puestos, cupos de canje y PIN de cada puesto |
| **Desafío** | Den (Respira y Transfórmate) | Cargar y publicar los 21 días; ver y exportar las inscripciones |
| **Puesto** | Cada marca con stand | Solo "modo canje" de su puesto, con link + PIN |
| **Puerta** | Guardianas que estén en el ingreso | Escanear ingresos y cobrar efectivo |
| **La Tregua** | Emi + equipo | Ver el contador de almuerzos y validar vales |

### 1.10 Cómo abre una marca el "modo canje"
1. Unos días antes, Vanesa crea el puesto en el panel. El sistema genera un **link personal del puesto** (por ejemplo `.../puesto/petruca`) y un **PIN de 4 dígitos**.
2. Vanesa se los manda a la marca por WhatsApp.
3. El día del festival, la marca abre el link en su celular, pone el PIN y queda logueada todo el día. Puede "agregar a pantalla de inicio" para tenerlo como una app.
4. La pantalla es un solo botón grande: **"Escanear entrada"**. Se abre la cámara y escanea el QR del celular de la persona.
   - Si la cámara falla, se puede tipear el **código corto** que aparece debajo del QR (por ejemplo `MIC-7K3P`).
5. El sistema responde:
   - 🟢 **"Entrada válida — Juana P."**: la marca escribe qué entregó (opcional) y toca **Confirmar canje**.
   - 🔴 **"Esta entrada ya fue canjeada en [puesto] a las 15:42"**.
   - 🟠 **"Llegaste al tope de 2 canjes de este puesto"**.
6. La pantalla siempre muestra "Canjes usados: 1 de 2".

### 1.11 Liquidación a los puestos
**[PENDIENTE]** Falta definir si Micelia le devuelve a cada puesto el valor de los canjes (y si retiene algún %) o si el canje es la colaboración de la marca. El sistema queda preparado para las dos opciones: genera un reporte por puesto (cantidad de canjes × valor) y permite configurar un % de retención y marcar cada puesto como "pagado".

---

## PARTE 2 · El micrositio

### 2.1 Infraestructura (costo $0)
- **Frontend**: Cloudflare Pages (cuenta de Micelia), con una URL tipo `festival-micelia.pages.dev`. Sin dominio propio.
- **Backend**: Supabase, plan gratuito (cuenta de Micelia): base de datos Postgres, autenticación, almacenamiento de comprobantes e imágenes, y Edge Functions.
- **Código**: repositorio en GitHub conectado a Cloudflare Pages, para que se publique solo con cada cambio.
- Opcional: Resend (plan gratuito) para emails automáticos.
- ⚠️ En el plan gratuito, Supabase pausa el proyecto tras 7 días sin actividad. Con el desafío en marcha no debería pasar, pero conviene revisarlo en enero.

### 2.2 Páginas públicas (mobile-first)
1. **Inicio**: concepto, fecha, lugar (o "a confirmar"), cuenta regresiva, avisos activos y botones a Desafío / Entradas / Bolsa Ritual / Telegram.
2. **Desafío 21 días**: explicación, formulario de inscripción y grilla de 21 días (publicados con su video; futuros bloqueados con su fecha).
3. **Entradas**: las dos opciones (Mañana completa $25.000 con cupos restantes / Solo tarde $5.155), checkout con transferencia o efectivo, y subida de comprobante.
4. **Mi entrada** (`/e/:token`): QR grande, código corto, tipo de entrada, estado (pendiente / pagada / ingresó / canjeada / almuerzo retirado) e instrucciones.
5. **Cronograma**: actividades por horario, con filtros por espacio y categoría y un resaltado de "Ahora" el día del festival.
6. **Marcas / Guía de regalos**: grilla de marcas con filtros por rubro; ficha con productos, precios, disponibilidad (antes / en el festival / después) y botones de WhatsApp e Instagram.
7. **Bolsa Ritual**: configurador de la Bolsa Ritual (una sola hoy; el modelo admite sumar otras), extras con total en vivo, opción "para regalar" y checkout.
8. **Sumá tu marca**: formulario de postulación para feriantes y marcas, que llega al panel de Vanesa.
9. **Info práctica / FAQ**: cómo llegar, cómo funciona el canje, accesibilidad, cero papel y contacto.

### 2.3 Panel interno (`/panel`)
- **Login**: guardianas por email con magic link (Supabase Auth). Puestos con link + PIN.
- **Inicio del panel**: métricas de inscriptas al desafío, entradas por tipo y estado, cupos restantes de la mañana, almuerzos a preparar, ingresos registrados, canjes, capacidad de canje (cupos totales vs entradas) y bolsas vendidas.
- **Pagos pendientes**: lista con comprobante, botón Validar / Rechazar y botón de WhatsApp.
- **Entradas**: búsqueda por nombre o código, alta manual (para efectivo o invitaciones) y anulación.
- **Marcas y puestos** (Alianzas): postulaciones → aprobar; productos; puesto, cupo y PIN; copiar el mensaje de WhatsApp con link + PIN.
- **Cronograma**: actividades (CRUD).
- **Desafío** (rol Desafío): 21 días con fecha, título, link de YouTube y publicado sí/no; inscripciones con exportación a CSV.
- **Bolsa Ritual**: productos base, extras habilitados y pedidos (estado de pago, punto de retiro y entregado sí/no).
- **Avisos en vivo**: texto corto, activo sí/no, destacado.
- **Puerta**: escáner de ingreso + **venta en puerta** (transferencia o efectivo, con QR en pantalla y envío por WhatsApp) + total de efectivo para el arqueo.
- **La Tregua**: contador de almuerzos y escáner de vales.
- **Liquidación**: canjes por puesto (valor, % de retención) + ventas de extras de la Bolsa Ritual por marca; marcar pagado y exportar CSV.
- **Configuración**: nombre del festival, lugar, valores y cupos, alias/CVU/titular para transferencias y textos.

### 2.4 Modelo de datos (Supabase)

```
config              (clave, valor jsonb)                       -- nombre, lugar, alias, textos, flags
perfiles            (user_id → auth.users, nombre, rol: admin|alianzas|desafio|puerta|tregua)

tipos_entrada       (id, nombre, descripcion, precio, cupo null=sin tope,
                     incluye_almuerzo bool, incluye_festival bool, valor_canje, activo, orden)
pedidos             (id, codigo unico 'MIC-XXXX', tipo: entrada|bolsa, nombre, email, whatsapp,
                     token unico (link /p/:token), total, metodo_pago: transferencia|efectivo, canal: online|puerta,
                     estado: pendiente|comprobante_enviado|pagado|rechazado|vencido|cancelado,
                     comprobante_path, vence_at, es_regalo, regalo_para, regalo_mensaje,
                     entrega: retiro_petruca|retiro_festival, estado_entrega, notas, validado_por, created_at)
pedido_items        (id, pedido_id, item_tipo: tipo_entrada|bolsa|producto, item_id, cantidad, precio_unit)
entradas            (id, pedido_id, tipo_entrada_id, titular_nombre, token unico (≥22 chars aleatorios),
                     codigo_corto unico, activa bool (true al pagar),
                     ingreso_at, ingreso_por, almuerzo_at, almuerzo_por, created_at)

marcas              (id, nombre, slug, tipo: guardiana|feriante|invitada|micelia|gastronomia|alianza,
                     rubro, descripcion, logo_path, instagram, whatsapp, web,
                     estado: postulada|confirmada|rechazada, en_guia_regalos bool, participa_festival bool,
                     contacto_interno, notas_internas, created_at)
productos           (id, marca_id, nombre, descripcion, precio, foto_path,
                     disp_previa bool, disp_festival bool, disp_post bool,
                     agregable_a_bolsa bool, activo, orden)
puestos             (id, marca_id, nombre, slug, pin_hash, cupo_canjes int null=sin tope, ubicacion, activo)
canjes              (id, entrada_id UNIQUE, puesto_id, detalle, created_at)   -- UNIQUE = un QR, un canje
liquidaciones       (puesto_id, porcentaje_retencion, pagado bool, pagado_at, notas)

bolsas              (id, nombre, descripcion, precio_base, foto_path, activo)   -- hoy 1 sola: Bolsa Ritual Micelia × Petruca
bolsa_items_base    (bolsa_id, producto_id, cantidad)

actividades         (id, titulo, descripcion, marca_id null, inicio timestamptz, fin, espacio,
                     categoria, franja: manana|tarde, imagen_path, publicado)
avisos              (id, texto, destacado bool, activo bool, created_at)

desafio_dias        (dia 1..21 PK, fecha, titulo, descripcion, youtube_url, publicado bool)
desafio_inscripciones (id, nombre, email unico, whatsapp, ciudad, como_se_entero,
                     acepta_comunicaciones bool, token, created_at)
desafio_checks      (inscripcion_id, dia, created_at)  PK(inscripcion_id, dia)
```

**Storage**: bucket privado `comprobantes`; buckets públicos `marcas`, `productos` y `festival`.

### 2.5 Reglas de negocio (implementar en el servidor, no solo en la pantalla)
1. **Cupo de la mañana (20)**: cuentan las entradas de pedidos `pagado` + `pendiente/comprobante_enviado` no vencidos. Con el cupo lleno, no se puede comprar.
2. **Vencimiento**: los pedidos en efectivo y los de transferencia sin comprobante vencen a las 48 hs (`vence_at`) y liberan el cupo. Los de transferencia con comprobante subido no vencen hasta que alguien los revisa.
3. **Activación**: el QR solo es válido si `entradas.activa = true`, que se pone al validar el pago.
4. **Canje** (Edge Function `canjear`, transaccional, con bloqueo de fila):
   - el token existe y la entrada está activa;
   - el tipo de entrada tiene `valor_canje > 0`;
   - la entrada no tiene canje previo (UNIQUE en `canjes.entrada_id`);
   - el puesto está activo y `canjes del puesto < cupo_canjes` (o cupo null);
   - solo el día del festival, en la franja configurada;
   - si la entrada no registró ingreso, permitir igual pero avisar ("no registró ingreso");
   - devuelve mensajes claros: ok / ya canjeada (dónde y cuándo) / cupo lleno / entrada no válida.
5. **Ingreso**: registra la primera vez; si se escanea de nuevo, muestra "ya ingresó a las HH:MM" (no es un error).
6. **Almuerzo**: solo para tipos con `incluye_almuerzo`, una sola vez.
7. **Capacidad de canje**: el panel muestra la suma de cupos de puestos activos vs entradas con `valor_canje > 0`, y alerta si la capacidad no alcanza.
8. **Sesión de puesto**: PIN validado por una Edge Function que emite un token firmado solo para ese puesto (válido 24 hs). Bloqueo tras 5 intentos fallidos.
9. **Precio de bolsas**: el total se recalcula en el servidor (precio base + extras), nunca se confía en el total que manda el navegador.
10. **Seguridad**: RLS en todas las tablas. Lo público solo lee lo publicado o activo. Las escrituras públicas (inscripción, pedidos, postulaciones, comprobantes) pasan por Edge Functions o políticas acotadas de solo inserción. Los datos personales solo los ven los roles correspondientes (inscripciones del desafío: admin + desafío).
11. **Privacidad**: checkbox de consentimiento en la inscripción al desafío, aclarando que los datos los gestiona Respira y Transfórmate junto con Micelia.

### 2.6 Diseño
- Mobile-first: casi todo el tráfico va a venir de Instagram, Telegram y WhatsApp.
- **Borrador visual neutro con la paleta de Micelia.** Todo el sistema usa la paleta oficial de Micelia (ver la página "Paleta de Colores" en Notion → Comunicación → Identidad Visual Micelia), con un tono neutro como base (fondos claros y texto oscuro) y los colores de marca como acentos (botones, estados, destacados).
- Los colores se definen **una sola vez** como variables CSS / tokens de Tailwind (`--color-fondo`, `--color-superficie`, `--color-texto`, `--color-primario`, `--color-secundario`, `--color-acento`, `--color-exito`, `--color-alerta`, `--color-error`), para poder cambiar después toda la estética desde un solo archivo.
- **Paleta oficial de Micelia:**

| Nombre | HEX | Uso en el sistema |
|---|---|---|
| Crema (fondo del brand board) | `#F5F0EA` | `--color-fondo`: fondo general |
| Blanco | `#FFFFFF` | `--color-superficie`: tarjetas y formularios |
| **Bosque** | `#2A4030` | `--color-primario` y `--color-texto`: textos, botones principales, header |
| **Tierra** | `#D5C1A1` | `--color-secundario`: bordes, separadores, chips, fondos suaves |
| **Arcilla** | `#C38065` | `--color-acento`: destacados y CTA secundarios (sobre arcilla, texto en Bosque, no en blanco, por contraste) |
| **Amor** | `#895A6A` | Acento de la sección Bolsa Ritual / Guía de regalos |
| **Lavanda** | `#A497BB` | Acento de la sección Desafío de Gratitud |

- Cada sección tiene su acento: Desafío en Lavanda, mañana de yoga en Tierra, festival de la tarde en Arcilla y Bolsa/regalos en Amor. El Bosque es el hilo común.
- **Colores funcionales** (solo para estados en los escáneres y alertas; tienen que leerse a pleno sol): éxito `#3F7D52`, alerta `#C9892B`, error `#B4443C`.
- Contraste mínimo AA: texto chico siempre en Bosque sobre fondos claros, o en blanco sobre Bosque/Amor.
- Etapa 2 (identidad del festival **[PENDIENTE]**): sumar elementos gráficos, texturas, íconos e imagen principal sin tocar la estructura.
- Tono: el lenguaje de Micelia (bosque, guardianas, territorios, ritual), cálido y simple.
- Accesibilidad: buen contraste, botones grandes (sobre todo en los modos de escaneo, que se usan con sol y apuro) y textos alternativos.
- Todo el texto editable (avisos, días del desafío, actividades, marcas) sale de la base de datos, no del código.

---

## PARTE 3 · Checklist de pendientes

| # | Pendiente | Responsable | Estado |
|---|---|---|---|
| 1 | Confirmar lugar (define el cupo de la tarde) | Consejo | Pendiente |
| 2 | Nombre definitivo: "Festival de Solsticio" | Comunicación | ✅ Resuelto 14/11 |
| 3 | Identidad visual del festival (elementos gráficos, texturas, íconos) | Comunicación | Borrador con la paleta de Micelia; personalizar después |
| 4 | Códigos HEX de la paleta de Micelia para el sistema | Comunicación | ✅ Resuelto (sección 2.6) |
| 5 | Valor final de la entrada de la tarde (¿$5.155?) | Prosperidad | Pendiente |
| 6 | Liquidación a puestos: ¿se reintegra el canje?, ¿% de retención?, ¿cuándo se paga? | Prosperidad + Alianzas | Pendiente |
| 7 | Cupo de canje por puesto y capacidad total vs entradas vendidas | Alianzas | Pendiente |
| 8 | Alias/CVU y titular de Personal Pay para mostrar en el sitio; consulta a la contadora | Prosperidad | Cuenta definida: Personal Pay |
| 9 | Fecha de inicio del desafío y links diarios de YouTube | Respira y Transfórmate | Pendiente (estimado 28/11) |
| 10 | 5 productos base y precio de la Bolsa Ritual Micelia × Petruca | Consejo + Alianzas | Pendiente |
| 11 | Extras de la bolsa: qué marcas y productos, precios, % para Micelia y stock | Alianzas | Pendiente |
| 12 | Menú del almuerzo (vale de la mañana) + oferta de comida de la tarde | Alianzas + La Tregua | Pendiente |
| 13 | Lista de marcas, fichas, fotos y productos | Alianzas | Continuo hasta el 12/12 |
| 14 | Cronograma de actividades de la tarde | Consejo | Primera semana de diciembre |
| 15 | Política de devoluciones / cambios de entradas | Gobernanza | Pendiente |
| 16 | Simulacro del día con guardianas y algunas marcas | Todas | Antes del 15/12 |
| 17 | Cuentas de Supabase y Cloudflare de Micelia; repo en GitHub | Comunicación (Estefi) | Pendiente |

**Resuelto el 14/11:** la entrada de la mañana no es canjeable; hay una sola bolsa (Micelia × Petruca) con extras de otras marcas; la bolsa se retira en el local de Petruca (calle Espejo, Ciudad de Mendoza) o en el festival; se cobra con Personal Pay, por transferencia o en efectivo, antes o el mismo día; La Tregua vende comida también a la tarde.

---

## PARTE 4 · Instructivo para Claude Code

### 4.0 Antes de empezar (checklist técnica)
- [ ] Cuenta de **Supabase** de Micelia, con un proyecto nuevo `festival-micelia` (región São Paulo). Anotar Project URL, anon key y service role key (esta última nunca va al frontend).
- [ ] Cuenta de **Cloudflare** de Micelia.
- [ ] Cuenta / repositorio en **GitHub** (`micelia-festival`).
- [ ] Node 20+, Supabase CLI y Claude Code instalados.
- [ ] Una carpeta vacía con **este archivo** guardado como `docs/BRIEF.md`.

### 4.1 Prompt inicial (pegar en Claude Code)

```
Vamos a construir el micrositio del Festival de Solsticio de Micelia Cooperativa.
Toda la especificación está en docs/BRIEF.md: leela completa antes de proponer nada.

Stack:
- Frontend: Vite + React + TypeScript + Tailwind, SPA con React Router, mobile-first.
  Deploy en Cloudflare Pages (build: `npm run build`, output: `dist`), con _redirects para SPA.
- Backend: Supabase (Postgres + RLS + Auth con magic link + Storage + Edge Functions en Deno).
- Escaneo QR: librería basada en cámara del navegador (ej. html5-qrcode o @zxing/browser),
  con fallback a tipear el código corto. Generación de QR: librería `qrcode`.
- Todo en español rioplatense. Moneda ARS formateada con Intl ($ 25.000).
- Zona horaria: America/Argentina/Mendoza.

Reglas:
- Respetá las reglas de negocio de la sección 2.5 en el servidor (Edge Functions / funciones SQL),
  no solo en el frontend.
- RLS activado en todas las tablas desde la primera migración.
- Todo el contenido editable sale de la base de datos.
- Prioridad: velocidad. Prefiero un borrador funcional publicado hoy a algo perfecto la semana próxima.

Primero mostrame: estructura de carpetas, lista de migraciones y lista de Edge Functions.
Cuando lo apruebe, construimos por fases (sección 4.2 del brief).
```

### 4.2 Fases de construcción
> Idea: tener todo lo público online **en borrador lo antes posible** y después ajustar.

**Fase 1 · Público + ventas (objetivo: online antes del 25/11)**
```
Fase 1:
1. Migraciones: todas las tablas de la sección 2.4, RLS, buckets de Storage y seeds con datos
   de ejemplo marcados "a confirmar" (2 tipos de entrada (Mañana $25.000 cupo 20 valor_canje 0 incluye almuerzo y festival;
   Tarde $5.155 valor_canje 5.155), 21 días del desafío sin publicar,
   1 bolsa (Bolsa Ritual Micelia × Petruca), 3 marcas de ejemplo, config con valores del brief).
2. Páginas públicas: Inicio, Desafío (inscripción + grilla de 21 días), Entradas (checkout
   transferencia/efectivo + subida de comprobante), Mi entrada (/e/:token con QR y código corto),
   Bolsa Ritual (configurador + checkout + "para regalar"), Marcas/Guía de regalos,
   Sumá tu marca, FAQ.
3. Edge Functions: crear_pedido (valida cupo, recalcula totales, genera código y vence_at),
   subir_comprobante, inscribir_desafio.
4. Panel mínimo: login magic link, roles, Pagos pendientes (validar → activa entradas + botón
   WhatsApp wa.me con el link de la entrada), Desafío (cargar días/links, exportar CSV),
   Marcas y postulaciones, Configuración.
5. Deploy en Cloudflare Pages con variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
Al terminar, dame la URL y un checklist para probar con el celular.
```

**Fase 2 · Contenido y operación previa (primera semana de diciembre)**
```
Fase 2:
- Cronograma público con filtros y "Ahora" + CRUD en el panel.
- Avisos en vivo (banner en Inicio) + CRUD.
- Panel de métricas (sección 2.3) con alerta de capacidad de canje.
- Puestos: crear puesto, cupo, generar PIN, botón "copiar mensaje para WhatsApp" con link + PIN.
- Pedidos de la Bolsa Ritual: estado de pago, punto de retiro (Petruca / festival) y entregado.
- Vencimiento automático de pedidos (cron de Supabase o chequeo al consultar).
```

**Fase 3 · El día del festival (lista y probada antes del 15/12)**
```
Fase 3:
- /puesto/:slug: login con PIN (Edge Function login_puesto, token 24 hs, bloqueo por intentos),
  pantalla con botón "Escanear entrada", resultado verde/rojo/naranja, contador "X de Y canjes".
- Edge Function canjear (transaccional, todas las validaciones de 2.5.4).
- /panel/puerta: escáner de ingreso (registra o muestra "ya ingresó").
- /panel/tregua: contador de almuerzos (pagados vs retirados) + escáner de vale.
- Venta en puerta (transferencia al alias o efectivo): crear la entrada, marcar pagada, mostrar el QR
  en pantalla y enviarlo por WhatsApp. Respetar el cupo de la mañana. Total de efectivo para arqueo.
- Agregar como app (manifest PWA, ícono de Micelia).
- Script de simulacro: crear 10 entradas de prueba y un puesto de prueba para ensayar.
```

**Fase 4 · Post-festival**
```
Fase 4:
- Liquidación por puesto (canjes × valor, % retención) + extras de la Bolsa Ritual vendidos por marca;
  marcar pagado, exportar CSV.
- Modo "Guía de regalos": Inicio pasa a destacar marcas y bolsas; ocultar compra de entradas.
- Reporte final: inscriptas al desafío, entradas por tipo, ingresos, canjes, bolsas, en CSV.
```

### 4.3 Simulacro antes del festival
- [ ] Comprar una entrada de cada tipo (transferencia y efectivo) desde un celular.
- [ ] Validar los pagos desde el panel y mandar la entrada por WhatsApp.
- [ ] Escanear el ingreso con el celular de una guardiana.
- [ ] Canjear en un puesto de prueba; intentar canjear la misma entrada otra vez (tiene que rechazarla).
- [ ] Llenar el cupo de un puesto y verificar que bloquee.
- [ ] Validar un almuerzo en la vista de La Tregua.
- [ ] Probar con mala señal (con el wifi del lugar y con datos).
- [ ] Revisar la liquidación de prueba y después **borrar los datos de prueba**.

### 4.4 Mejoras opcionales (si sobra tiempo)
- Email automático con la entrada (Resend).
- Check diario del desafío con link personal y barra de progreso.
- Inscripción a actividades de la tarde con cupo.
- Mapa del predio.
- Contador público de "lugares que quedan" para la mañana (genera urgencia).
