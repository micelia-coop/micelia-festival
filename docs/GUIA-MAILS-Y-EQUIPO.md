# Guía · Mails automáticos y usuarias del panel

## A · Recuperar tu acceso (Estefi)
Supabase (cuenta de Micelia) → proyecto → **SQL Editor** → New query → pegá esto
cambiando `NUEVA_CLAVE` (escribila solo ahí) → **Run** → tiene que aparecer tu email.

```sql
update auth.users
set encrypted_password = extensions.crypt('NUEVA_CLAVE', extensions.gen_salt('bf'))
where lower(email) = 'teficuelloasesorias@gmail.com'
returning email;
```

Desde ahora, cualquiera puede cambiar su contraseña en **Panel → Mi cuenta**.

## B · Usuarias para el equipo
Para cada guardiana:
1. Supabase → **Authentication → Users → Add user → Create new user**: su email + una contraseña provisoria + ✅ *Auto Confirm User*.
2. Panel → **Equipo**: su email, su nombre y los roles → Guardar.
3. Mandale por WhatsApp: `https://festival-micelia.pages.dev/panel`, su email y la contraseña provisoria, y pedile que la cambie en **Mi cuenta**.

| Rol | Puede |
|---|---|
| Admin general | Todo |
| Alianzas | Marcas, productos, links de registro de marcas, puestos |
| Desafío | Días y videos del desafío, inscriptas y CSV |
| Puerta | Ingresos y venta en puerta (día del festival) |
| La Tregua | Almuerzos (día del festival) |

## C · Mails automáticos desde el Gmail de Micelia
Se mandan solos cuando:

| Pasa esto | Le llega a la persona | Aviso a Micelia |
|---|---|---|
| Inscripción al desafío | Bienvenida + link al desafío | ✅ |
| Postulación "Sumá tu marca" | — | ✅ |
| Marca completa su registro | Confirmación + link para editar (solo la 1ª vez) | ✅ (también si actualiza) |
| Pedido nuevo (entradas o bolsa) | Detalle + cómo pagar + link al pedido | ✅ |
| Sube comprobante | "Recibimos tu comprobante" | ✅ "para validar" |
| Pago validado | Entradas con QR / confirmación de bolsa | — |
| Pago rechazado | Pedido de reenviar comprobante | — |

Todos los mails quedan en **Enviados** del Gmail de Micelia. Límite de Gmail: ~100 por día.

### Pasos (una sola vez, ~15 min)
1. **Actualizar la base:** SQL Editor → pegar todo `1-actualizacion.sql` → Run → *Success*. Avisarle a Claude (publica la web nueva).
2. **Crear el programa de mails**, con la cuenta de Google de **Micelia**:
   1. Entrá a <https://script.google.com> → **Nuevo proyecto** → arriba a la izquierda poné de nombre *Mails Festival de Solsticio*.
   2. Borrá lo que hay en `Código.gs`, pegá todo el archivo `Codigo.gs` y guardá (💾).
   3. Arriba, en el selector de funciones, elegí **probar** → **Ejecutar**. Te pide permisos: *Revisar permisos* → elegí la cuenta de Micelia → *Configuración avanzada* → *Ir a Mails Festival de Solsticio (no seguro)* → *Permitir*. (Es tu propio programa: el aviso de Google es normal.) Te tiene que llegar un mail de prueba.
   4. **Implementar → Nueva implementación** → ⚙️ tipo **Aplicación web** → *Ejecutar como*: **Yo** · *Quién tiene acceso*: **Cualquier usuario** → **Implementar** → copiá la **URL** (termina en `/exec`).
3. **Conectar:** SQL Editor → pegar `2-conectar-mails.sql`, reemplazar `PEGAR_ACA_LA_URL` por la URL → Run → abajo aparece la **clave secreta**: copiala.
4. **Guardar la clave en el programa:** Apps Script → ⚙️ **Configuración del proyecto** → abajo de todo *Propiedades de la secuencia de comandos* → **Agregar propiedad**: nombre `SECRETO`, valor: la clave → **Guardar**.
   (Opcional: otra propiedad `AVISO_EMAIL` si querés que los avisos lleguen a otra casilla.)
5. **Probar:** SQL Editor → `3-probar-mails.sql` → Run → en 1 minuto llega *"[Festival] ✅ Prueba de mails"* al Gmail de Micelia.

### Cambiar los textos
En el Apps Script, sección **TEXTOS**. Después de editar: **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar** (la URL no cambia).
