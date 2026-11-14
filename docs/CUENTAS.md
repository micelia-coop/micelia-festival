# Cuentas del Festival de Solsticio · Guía de alta

Orden: **1) GitHub → 2) Supabase → 3) Cloudflare.** Usá siempre el mail de Micelia.
Guardá todas las contraseñas en un gestor (Bitwarden gratis, por ejemplo) y activá la verificación en dos pasos (2FA) en las tres cuentas.
**Nunca pegues contraseñas ni claves secretas en el chat.**

---

## 1 · GitHub (10 min)

1. Entrá a https://github.com/signup con el mail de Micelia. Usuario sugerido: `micelia-coop`.
2. Verificá el mail y activá la 2FA (Settings → Password and authentication).
3. Creá el repositorio: botón **+** → **New repository**
   - Nombre: `micelia-festival`
   - **Private**
   - **No** marques README, .gitignore ni licencia (tiene que quedar vacío).
4. Para que Claude pueda subir el código:
   - Entrá a https://claude.ai/connect-github y conectá la cuenta de GitHub de Micelia.
   - Instalá la **Claude GitHub App** en el repo `micelia-festival` (desde esa misma página).
5. Pasale a Claude la dirección del repo (ej. `micelia-coop/micelia-festival`).

> Si después quieren que otra guardiana edite el código: Settings del repo → Collaborators → Add people.

---

## 2 · Supabase (15 min)

### 2.1 Cuenta y proyecto
1. Entrá a https://supabase.com → **Start your project** → **Continue with GitHub** (con la cuenta de GitHub de Micelia, así queda todo junto).
2. Te pide crear una organización:
   - Nombre: `Micelia Cooperativa`
   - Tipo: Non-profit / Personal
   - Plan: **Free**
3. **New project**:
   - Nombre: `festival-micelia`
   - Database password: tocá **Generate a password**, copiala **al gestor de contraseñas** (no a Claude).
   - Región: **South America (São Paulo)**
   - Create new project. Tarda 1–2 minutos.

### 2.2 Darle acceso a Claude
La conexión de Supabase de esta sesión de Claude está hecha con tu cuenta personal. La forma más simple:
1. En el proyecto, abajo a la izquierda → **Organization settings → Team → Invite member**.
2. Invitá tu mail personal de Supabase con rol **Developer**.
   (Developer alcanza para crear tablas y Edge Functions, y no cuenta para el límite de 2 proyectos gratis de tu cuenta.)
3. Aceptá la invitación desde tu mail personal y avisale a Claude: él va a ver el proyecto.

### 2.3 Login de las guardianas (Authentication)
1. **Authentication → Sign In / Providers → Email**: dejarlo activado.
2. Desactivar **Allow new users to sign up** (solo entran guardianas que demos de alta nosotras).
3. **Authentication → URL Configuration** (se completa cuando exista Cloudflare, paso 3):
   - Site URL: `https://festival-micelia.pages.dev`
   - Redirect URLs: `https://festival-micelia.pages.dev/**`, `https://*.festival-micelia.pages.dev/**`, `http://localhost:5173/**`

> ⚠️ El envío de mails incluido en Supabase gratis está muy limitado (pocos mails por hora y, en principio, solo a direcciones del equipo). Por eso conviene que las guardianas entren con **email + contraseña** que crea una admin, en lugar de magic link. Si después se suma un dominio propio, se configura Resend y se activa el magic link.

### 2.4 Datos que sí se pueden compartir con Claude
En **Project Settings → API Keys** (o Data API):
- **Project URL** (`https://xxxx.supabase.co`): pública, se puede pasar.
- **Publishable / anon key**: pública, se puede pasar.
- **Secret / service_role key**: ❌ **no se comparte con nadie**. Claude no la necesita: las Edge Functions la reciben solas.

---

## 3 · Cloudflare (10 min, cuando el repo ya tenga código)

### 3.1 Cuenta
1. Entrá a https://dash.cloudflare.com/sign-up con el mail de Micelia, verificá el mail y activá la 2FA.
2. No hace falta agregar un dominio ni una tarjeta. Si pregunta por un plan, elegí **Free**.

### 3.2 Conectar el sitio (esto lo hacemos juntas cuando Claude suba la primera versión)
1. Menú izquierdo **Workers & Pages → Create**.
2. Elegí la pestaña **Pages** (si solo ves Workers, buscá el link "Looking to deploy Pages? Get started").
3. **Connect to Git** → autorizá GitHub → dale acceso **solo** al repo `micelia-festival`.
4. Configuración del build:
   - Project name: `festival-micelia` (define la URL `festival-micelia.pages.dev`)
   - Production branch: `main`
   - Framework preset: **React (Vite)**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     - `VITE_SUPABASE_URL` = Project URL de Supabase
     - `VITE_SUPABASE_ANON_KEY` = publishable/anon key
     - `NODE_VERSION` = `20`
5. **Save and Deploy**. Desde ese momento, cada cambio que se sube a GitHub se publica solo.
6. Volvé a Supabase y completá el paso 2.3.3 (URL Configuration).

---

## Checklist para pasarle a Claude
- [ ] Repo creado: `usuario/micelia-festival` + GitHub conectado en claude.ai
- [ ] Proyecto Supabase `festival-micelia` creado + tu cuenta personal invitada como Developer
- [ ] Project URL y publishable key (opcional, Claude también las puede leer)
- [ ] Cuenta de Cloudflare creada (el proyecto de Pages se conecta después)
