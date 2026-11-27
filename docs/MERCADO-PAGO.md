# Mercado Pago · Qué necesitamos (para hacerlo juntas)

## Antes de empezar (decisiones)
- [ ] **Plazo de acreditación** en la cuenta de Micelia (en el momento / a los X días): cambia la comisión. Lo define Prosperidad.
- [ ] **¿Cuotas?** ¿Se permiten pagos en cuotas o solo en un pago?
- [ ] **¿Siguen la transferencia y el efectivo** como opciones, además de Mercado Pago?
- [ ] **Nombre en el resumen de la tarjeta** (máx. 13 letras), por ej. `MICELIA`.
- [ ] Consulta a la contadora: facturación de lo cobrado por Mercado Pago.

## Lo que hay que tener a mano
- [ ] Usuario y contraseña de la **cuenta de Mercado Pago de Micelia** (con la verificación de identidad completa).
- [ ] Acceso a la **cuenta de Supabase de Micelia** (para guardar la clave secreta).
- [ ] Ideal: el conector de Supabase de Claude conectado a la organización del festival (para que Claude instale las funciones).

## Lo que vamos a hacer ese día (te guío paso a paso)
1. En <https://www.mercadopago.com.ar/developers> → *Tus integraciones* → **Crear aplicación** (tipo: pagos online · producto: **Checkout Pro**).
2. Completar los datos del negocio (web: `https://festival-micelia.pages.dev`) para activar las **credenciales de producción**.
3. Copiar la **Public Key** (pública) y el **Access Token** (SECRETO: no se pega en el chat; se guarda en Supabase como secreto).
4. Claude instala las funciones de pago y el aviso automático de Mercado Pago (webhook).
5. Prueba con las **credenciales de prueba** y una compra real chiquita.
