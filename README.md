# Soporte Telecom

Sistema integral de **soporte al cliente para el sector de telecomunicaciones**: gestión de tickets, chat en tiempo real con **chatbot de Nivel 1 (IA)**, base de conocimiento y panel de administración con métricas y automatizaciones.

<p>
  <a href="https://soporte-telecom.vercel.app"><img alt="Demo en vivo" src="https://img.shields.io/badge/Demo-Vercel-black?logo=vercel"></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js">
  <img alt="React" src="https://img.shields.io/badge/React-19.2.8-61dafb?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white">
  <img alt="DeepSeek" src="https://img.shields.io/badge/IA-DeepSeek-4d6bfe">
</p>

**Demo en producción:** https://soporte-telecom.vercel.app
**Repositorio:** https://github.com/jjavdev/Soporte-Telecom
**Proyecto académico** — Ingeniería de Software I · ING. Dubraska Roca · CIVA 2026

---

## Tabla de Contenidos

1. [Objetivo](#objetivo)
2. [Demo](#demo)
3. [Funcionalidades](#funcionalidades)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Arquitectura](#arquitectura)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [Modelo de Datos](#modelo-de-datos)
8. [Chatbot Nivel 1 (IA)](#chatbot-nivel-1-ia)
9. [Automatizaciones](#automatizaciones)
10. [Roles y Seguridad](#roles-y-seguridad)
11. [Testing](#testing)
12. [Instalación](#instalación)
13. [Variables de Entorno](#variables-de-entorno)
14. [Scripts Disponibles](#scripts-disponibles)
15. [Despliegue](#despliegue)
16. [Troubleshooting](#troubleshooting)
17. [Limitaciones conocidas](#limitaciones-conocidas)
18. [Documentación del Proyecto](#documentación-del-proyecto)

---

## Objetivo

Reducir la saturación del soporte de **primer nivel** en telecomunicaciones implementando un **chatbot con inteligencia artificial** que resuelva incidencias simples automáticamente (reinicio de router, cambio de clave Wi-Fi, consulta de saldo) y **escale a agentes humanos** cuando sea necesario. Complementado con gestión de tickets, base de conocimiento de auto-servicio, automatizaciones y métricas.

**Problema que resuelve:** ~70% de las consultas son repetitivas; sin automatización se generan colas telefónicas largas, churn y costos operativos altos.

---

## Demo

| | |
|---|---|
| **URL** | https://soporte-telecom.vercel.app |
| **Usuario demo (admin)** | `admin@soporte.com` / `Admin123!` |
| **Usuario demo (agente)** | `agente@soporte.com` / `Agente123!` |
| **Usuario demo (cliente)** | `cliente@soporte.com` / `Cliente123!` |

Capturas reales de la aplicación:

| Login | Dashboard | Crear Ticket |
|:---:|:---:|:---:|
| ![Login](docsInformeSoporte/assets/screenshots/01-login.png) | ![Dashboard](docsInformeSoporte/assets/screenshots/03-dashboard-cliente.png) | ![Crear ticket](docsInformeSoporte/assets/screenshots/04-crear-ticket.png) |

| Chat con Chatbot | Base de Conocimiento | Panel Admin |
|:---:|:---:|:---:|
| ![Chat](docsInformeSoporte/assets/screenshots/05-chat.png) | ![KB](docsInformeSoporte/assets/screenshots/06-knowledge.png) | ![Admin](docsInformeSoporte/assets/screenshots/07-admin-dashboard.png) |

---

## Diseño Responsivo (Mobile-First)

La UI se construyó **primero para móvil** y escala a tablet y escritorio:

| Dispositivo | Ancho | Adaptaciones |
|-------------|-------|--------------|
| Móvil | `< 768px` | Header compacto + menú lateral (`Sheet`) + barra inferior con `safe-area`; 1 columna; tarjetas en vez de tablas; filtros apilados; controles 40-44px |
| Tablet | `768–1023px` | Header de escritorio; grid 2 columnas; tablas con scroll |
| Escritorio | `≥ 1024px` | Navegación completa; contenedor `max-w-7xl`; grids 3-6 columnas; tablas densas |

| Móvil (390px) | Tablet (768px) | Escritorio (1440px) |
|:---:|:---:|:---:|
| ![Móvil dashboard](docsInformeSoporte/assets/responsive/movil/03-dashboard.png) | ![Tablet dashboard](docsInformeSoporte/assets/responsive/tablet/03-dashboard.png) | ![Escritorio dashboard](docsInformeSoporte/assets/responsive/escritorio/03-dashboard.png) |

Para regenerar las capturas responsivas: `.venv/bin/python scripts/capture-responsive.py`.

## Funcionalidades

### Cliente (`customer`)
- **Autenticación** — Registro e inicio de sesión con Supabase Auth.
- **Tickets** — Crear tickets (categoría, prioridad, título, descripción) y dar seguimiento a su historial.
- **Chat en vivo** — Conversación con el chatbot de Nivel 1 (IA) y escalamiento a agente humano.
- **Base de conocimiento** — Artículos de auto-servicio organizados por categorías, con búsqueda.

### Agente (`agent`)
- **Gestión de tickets** — Listar, filtrar (estado/prioridad) y atender los tickets asignados.
- **Comentarios** — Notas públicas e internas en cada ticket.
- **Chat** — Atender sesiones de chat en tiempo real (Supabase Realtime).

### Administrador (`admin`)
- **Dashboard** — Métricas globales: total de tickets, abiertos, chats activos, artículos KB.
- **Gestión de usuarios** — Crear/editar usuarios, cambiar rol y estado (activo/inactivo/suspendido).
- **Base de conocimiento** — CRUD completo de artículos (crear, editar, eliminar).
- **Reportes** — Tickets por estado y prioridad en el panel de administración.

> El rol `supervisor` está definido en el modelo de datos y es asignable desde el panel, pero aún no cuenta con una vista dedicada.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js (App Router, RSC + Turbopack) | 16.3.4 |
| UI | React | 19.2.8 |
| Lenguaje | TypeScript (strict) | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Componentes | shadcn/ui + Base UI | — |
| Estado global | Zustand | 5.x |
| Formularios | React Hook Form + Zod | 7.x / 3.x |
| Base de datos | Supabase (PostgreSQL + RLS) | — |
| Auth | Supabase Auth | — |
| Tiempo real | Supabase Realtime | — |
| IA Chatbot | DeepSeek (API OpenAI-compatible, `deepseek-chat`) vía API route | — |
| Automatización | PostgreSQL triggers + `pg_cron` (n8n opcional) | — |
| Testing | Vitest + React Testing Library (jsdom) | 5.x |
| Despliegue | Vercel | — |

---

## Arquitectura

Arquitectura en capas: SPA/SSR en Next.js, Supabase como backend (Auth, Postgres, Realtime) y el chatbot IA integrado en un **API route** server-side.

![Arquitectura en capas](docs/assets/diagrams/arquitectura-capas.png)

**Flujo de datos general:**

![Flujo de datos](docs/assets/diagrams/flujo-datos.png)

- **Capa de presentación** — Next.js (App Router) + Tailwind. Server Components para datos, Client Components para interactividad.
- **Capa de servicios** — Supabase (Auth, PostgreSQL, Realtime, Edge Functions) y el chatbot IA (`/api/chatbot`).
- **Capa de datos** — PostgreSQL gestionado por Supabase, con RLS por rol.
- **Despliegue** — Vercel (frontend) + GitHub (repositorio y CI/CD).

---

## Estructura del Proyecto

```
soporte-telecom/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login, Register
│   │   ├── (dashboard)/             # Panel principal (protegido)
│   │   │   ├── page.tsx             # Dashboard con métricas
│   │   │   ├── tickets/             # Lista, creación y detalle de tickets
│   │   │   ├── chat/                # Chat con chatbot + agente
│   │   │   └── knowledge/           # Base de conocimiento (+ [slug])
│   │   └── admin/                   # Panel de administración
│   │       ├── page.tsx             # Dashboard admin
│   │       ├── users/               # Gestión de usuarios
│   │       ├── knowledge/           # CRUD de artículos
│   │       └── reports/             # Reportes
│   ├── components/
│   │   ├── ui/                      # Componentes shadcn/Base UI
│   │   └── ...
│   ├── hooks/                       # useAuth, useTickets, useChat
│   ├── stores/                      # authStore (Zustand)
│   ├── lib/
│   │   ├── constants.ts             # Colores de estado y rol
│   │   ├── utils.ts                 # cn() y helpers
│   │   └── supabase/                # client, server, middleware
│   ├── types/database.ts            # Tipos del schema
│   └── middleware.ts                # Protección de rutas (auth)
├── tests/                           # Tests automatizados (Vitest)
│   ├── mocks/supabase-mock.ts
│   ├── stores/authStore.test.ts
│   ├── hooks/{useAuth,useTickets,useChat}.test.ts
│   └── components/ui.test.tsx
├── n8n-workflows/
│   └── 04-chatbot-nivel1.json       # Workflow del chatbot (alternativa a /api/chatbot)
├── scripts/                         # Utilidades (Python)
│   ├── build-informe.py             # Informe → PDF + DOCX
│   ├── build-diagrams.py            # Diagramas Typst → PNG
│   ├── capture-screenshots.py       # Capturas de la app (Playwright)
│   └── capture-test-screenshots.py  # Capturas de la ejecución de tests
├── docs/assets/diagrams/            # Diagramas de arquitectura
├── docsInformeSoporte/              # Evidencias (capturas, informe DOCX)
├── supabase-setup.sql               # Schema + RLS + triggers + pg_cron
├── docker-compose.yml               # n8n en Docker
├── vitest.config.mts                # Configuración de tests
├── .npmrc                           # legacy-peer-deps
├── .env.example                     # Template de variables (app)
└── .env.docker.example              # Template de variables (n8n)
```

---

## Modelo de Datos

8 tablas con **Row Level Security** y triggers de integridad/automatización:

![Diagrama entidad-relación](docs/assets/diagrams/er.png)

| Tabla | Propósito |
|-------|-----------|
| `users` | Perfiles (rol, estado, contacto). Se crea automáticamente al registrarse (trigger `on_auth_user_created`). |
| `categories` | Categorías de tickets (internet, telefonía, fibra, corporativo). |
| `tickets` | Tickets de soporte (estado, prioridad, SLA, cliente, agente). |
| `comments` | Comentarios de tickets (públicos / internos). |
| `knowledge_articles` | Artículos de la base de conocimiento (slug, vistas). |
| `chat_sessions` | Sesiones de chat (waiting / active / closed). |
| `chat_messages` | Mensajes de las sesiones de chat. |
| `notifications` | Notificaciones in-app para los usuarios. |

**Tipos ENUM:** `user_role`, `user_status`, `ticket_priority`, `ticket_status`, `comment_type`.

**Usuarios seed** (crear con `.venv/bin/python scripts/seed-users.py` — registra la cuenta en Auth y su perfil):

| Rol | Email | Password |
|-----|-------|----------|
| admin | `admin@soporte.com` | `Admin123!` |
| agent | `agente@soporte.com` | `Agente123!` |
| customer | `cliente@soporte.com` | `Cliente123!` |

---

## Chatbot Nivel 1 (IA)

El chatbot usa **IA real (DeepSeek, `deepseek-chat`)** para clasificar intenciones y generar respuestas contextuales, en lugar de reglas/regex. Se ejecuta **dentro de la app** en el API route `src/app/api/chatbot/route.ts` (server-side), por lo que funciona igual en local y en producción.

![Flujo del chatbot](docs/assets/diagrams/chatbot-flujo.png)

**Flujo:** `Frontend → POST /api/chatbot → DeepSeek (chat completions) → Parse JSON → { reply, intent, action }`

> n8n es **opcional**: el workflow `n8n-workflows/04-chatbot-nivel1.json` se conserva como alternativa, pero la aplicación ya no depende de él.

### Intenciones soportadas

| Intención | Descripción |
|-----------|-------------|
| `greeting` | El usuario saluda |
| `check_ticket_status` | Consulta el estado de un ticket |
| `create_ticket` | Necesita crear un ticket |
| `faq` | Preguntas frecuentes (router, WiFi, saldo, factura, velocidad) |
| `business_hours` | Horario de atención y canales de contacto |
| `escalate_to_human` | Quiere hablar con un agente humano |
| `unknown` | Intención no determinada |

### Acciones

| Acción | Efecto |
|--------|--------|
| `redirect_tickets` | Redirige a la sección de tickets |
| `escalate` | Transfiere a un agente humano |
| `null` | Sin acción adicional |

> El `thinkingBudget` está en `0` para ahorrar tokens de razonamiento en consultas simples.

---

## Automatizaciones

### n8n (opcional, 1 workflow)

| Workflow | Trigger | Acción |
|----------|---------|--------|
| Chatbot Nivel 1 | Webhook `POST /webhook/chatbot` | Clasifica la intención y responde (alternativa al API route) |

### Supabase nativo (PostgreSQL)

![Automatizaciones](docs/assets/diagrams/automatizaciones.png)

| Automatización | Tipo | Descripción |
|----------------|------|-------------|
| Auto-asignación | Trigger `BEFORE INSERT` | Asigna el agente activo con menor carga y fija `sla_deadline` |
| Notificación in-app | Trigger `AFTER UPDATE` | Notifica al cliente cuando cambia el estado del ticket |
| Escalamiento SLA | `pg_cron` (cada 5 min) | Escala a `urgent` los tickets que superaron su SLA |

---

## Roles y Seguridad

Cada rol tiene capacidades definidas y **aplicadas** en la UI (matriz central en `src/lib/permissions.ts`) y en la base de datos (RLS):

| Capacidad | customer | agent | supervisor | admin |
|-----------|:--------:|:-----:|:----------:|:-----:|
| Ver sus propios tickets / chats | ✅ | — | — | — |
| Ver todos los tickets (`tickets.viewAll`) | ❌ | ✅ | ✅ | ✅ |
| Cambiar estado del ticket (`tickets.update`) | ❌ | ✅ | ✅ | ✅ |
| Notas internas (`comments.internal`) | ❌ | ✅ | ✅ | ✅ |
| Gestionar chat (`chat.handle`) | ❌ | ✅ | — | ✅ |
| Ver reportes (`reports.view`) | ❌ | ❌ | ✅ | ✅ |
| Panel de administración (`admin.access`) | ❌ | ❌ | ❌ | ✅ |
| Gestionar usuarios (`users.manage`) | ❌ | ❌ | ❌ | ✅ |
| Gestionar KB (`kb.manage`) | ❌ | ❌ | ❌ | ✅ |

**Aplicación:**
- **Navegación:** el enlace "Admin Dashboard" solo aparece si `admin.access`.
- **Rutas:** `/admin/*` está protegido por rol (redirige a `/` si no es admin).
- **Tickets:** el cliente solo ve los suyos (RLS); agente/supervisor/admin ven todos.
- **Comentarios:** solo staff puede crear **notas internas**, y los clientes no las ven.
- **Estado del ticket:** solo `tickets.update` (agente/supervisor/admin).
- **Base de datos:** Row Level Security por rol en todas las tablas.
- **Protección de rutas:** middleware de Next.js valida la sesión y redirige a `/login`.

---

## Testing

Tests automatizados con **Vitest + React Testing Library** (entorno jsdom). La capa Supabase está mockeada, por lo que **no requieren base de datos ni servicios externos**.

```bash
npm test          # Ejecuta la suite (23 tests, ~2s)
npm run test:watch
```

```
tests/
├── mocks/supabase-mock.ts       # Mock de Supabase (query builder encadenable)
├── stores/authStore.test.ts     # Estado global de autenticación (4)
├── hooks/useAuth.test.ts        # Autenticación (3)
├── hooks/useTickets.test.ts     # Tickets: listar, filtrar, crear, actualizar (7)
├── hooks/useChat.test.ts        # Chat: sesión, historial, envío, creación (5)
└── components/ui.test.tsx       # Button y Badge (4)
```

La suite cubre requisitos funcionales clave (RF-001, RF-002, RF-005, RF-012) y no funcionales (RNF-010, RNF-011). Evidencia: `docsInformeSoporte/13-tests.typ`.

---

## Instalación

### Requisitos previos

- **Node.js 18+** y npm
- Cuenta de **Supabase** (supabase.com)
- API key de un proveedor **OpenAI-compatible** para el chatbot (por defecto **DeepSeek**: platform.deepseek.com)
- *(Opcional)* **Docker** si vas a usar n8n

### 1. Clonar e instalar

```bash
git clone https://github.com/jjavdev/Soporte-Telecom.git
cd soporte-telecom
npm install
```

> El repo incluye `.npmrc` con `legacy-peer-deps=true` (necesario por un conflicto de peer deps en `shadcn`/`@babel`).

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase y la API key del chatbot
```

### 3. Base de datos

En el **SQL Editor de Supabase**, ejecutar `supabase-setup.sql`. Esto crea:
- Los 5 tipos ENUM y las 8 tablas.
- Row Level Security (RLS) en todas las tablas.
- Triggers: `on_auth_user_created`, `updated_at`, auto-asignación y notificación.
- Función de escalamiento SLA + job `pg_cron` (requiere habilitar `pg_cron`).

Para habilitar el escalamiento:
1. Supabase → **Database → Extensions → `pg_cron`**.
2. Re-ejecutar la sección **10.3** de `supabase-setup.sql` para registrar el job `escalar-sla`.

### 4. n8n (opcional)

El chatbot ya funciona sin n8n (API route + DeepSeek). Solo si quieres usar el workflow:

```bash
bash scripts/setup-n8n.sh    # levanta n8n, importa y activa el workflow
```

O manualmente: `docker compose up -d` y luego en http://localhost:5678 → **Workflows → Import from File** → `n8n-workflows/04-chatbot-nivel1.json` → **Activar**.

> Si n8n no está disponible, la app muestra un aviso y sugiere un agente; el chat no se rompe.

### 5. Servidor de desarrollo

```bash
npm run dev        # http://localhost:3000
```

---

## Variables de Entorno

### App (`\.env.local`)

| Variable | Descripción | Requerida |
|----------|-------------|:---------:|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública) de Supabase | Sí |
| `CHATBOT_API_KEY` | API key del proveedor de IA (DeepSeek) — **server-side** | Sí |
| `CHATBOT_MODEL` | Modelo a usar (por defecto `deepseek-chat`) | No |
| `CHATBOT_API_URL` | Endpoint OpenAI-compatible (por defecto DeepSeek) | No |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | URL del webhook de n8n (solo si usas n8n) | No |

> El chatbot no expone la API key al cliente: la llamada al modelo se hace en el API route `/api/chatbot`.

### Docker / n8n (`\.env`) — opcional

| Variable | Descripción |
|----------|-------------|
| `N8N_BASIC_AUTH_USER` | Usuario de acceso a n8n |
| `N8N_BASIC_AUTH_PASSWORD` | Contraseña de acceso a n8n |
| `SUPABASE_URL` | URL de Supabase para workflows |
| `SUPABASE_SERVICE_KEY` | Service key para workflows |
| `GEMINI_API_KEY` | API key de Gemini (solo si usas el workflow original) |

> **Nunca subas `.env` ni `.env.local`** al repositorio (ya están en `.gitignore`).

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `.venv/bin/python scripts/build-informe.py` | Genera el informe **PDF + DOCX** |
| `.venv/bin/python scripts/build-diagrams.py` | Compila los diagramas (Typst → PNG) |
| `.venv/bin/python scripts/capture-screenshots.py` | Captura las pantallas de la app (Playwright) |
| `.venv/bin/python scripts/capture-responsive.py` | Captura móvil/tablet/escritorio (Playwright) |
| `.venv/bin/python scripts/seed-users.py` | Crea/actualiza los usuarios seed (auth + perfil + rol) |
| `bash scripts/setup-n8n.sh` | Levanta n8n, importa y activa el workflow del chatbot |
| `.venv/bin/python scripts/capture-test-screenshots.py` | Captura la ejecución de los tests |

---

## Despliegue

**Producción:** https://soporte-telecom.vercel.app

### Vercel (CLI)

```bash
vercel login
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "https://xxx.supabase.co" --type config --yes
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --value "eyJ..." --type config --yes
vercel --prod
```

Notas:
- La anon key es **pública** por diseño → `--type config` (si no, el CLI la rechaza por parecer credencial).
- `.vercelignore` excluye `.codegraph`, `.venv`, `docs*`, `tests`, `scripts` del upload.
- `.npmrc` (`legacy-peer-deps=true`) permite el `npm install` en el build de Vercel.

### Alternativa: integración con GitHub
Conectar el repositorio en vercel.com para despliegue automático en cada push a `main`.

---

## Troubleshooting

**El chatbot no responde**
- Verifica `CHATBOT_API_KEY` (y `CHATBOT_MODEL`) en `.env.local` / Vercel.
- Prueba el endpoint: `curl -X POST <url>/api/chatbot -H 'Content-Type: application/json' -d '{"message":"Hola"}'` (con sesión/auth).
- Si usas el flujo n8n: `docker compose ps` y activar el workflow.

**Error de autenticación**
- Confirmar que `supabase-setup.sql` se ejecutó (trigger `on_auth_user_created`).
- Verificar credenciales de Supabase en `.env.local`.

**La app no compila**
```bash
npm run build
npx tsc --noEmit   # ver errores de TypeScript
```

**`npm install` falla con ERESOLVE**
- Confirmar que existe `.npmrc` con `legacy-peer-deps=true`.

**n8n no inicia**
```bash
docker compose logs n8n
```
Verificar que el archivo `.env` existe en la raíz con las credenciales.

**Los cambios no se reflejan en tiempo real**
- Verificar la suscripción Realtime en Supabase y que la tabla tenga replicación habilitada.

---

## Limitaciones conocidas

- **Dependencia del proveedor de IA:** el chatbot usa DeepSeek vía API; si la API falla o no hay `CHATBOT_API_KEY`, el chat degrada con un aviso amigable.
- **Exportación de reportes:** los reportes muestran métricas en pantalla; la exportación a PDF/CSV está planificada, no implementada.
- **Rol `supervisor`:** definido en el modelo, sin vista dedicada.
- **MFA:** los requisitos RNF-005 (MFA para agentes/admin) y RNF-006 (backups) no están implementados en esta versión.

---

## Documentación del Proyecto

El informe completo está en `../docsInformeSoporte/` (Typst), en 13 capítulos: elicitación, requisitos, historias de usuario, casos de uso, uso de IA, prototipo UI/UX, arquitectura general, arquitectura de BD, automatizaciones, evidencia, gestión de tokens, base de conocimiento y pruebas automatizadas.

Para regenerar el informe (PDF + DOCX):

```bash
.venv/bin/python scripts/build-informe.py
```

---

## Autores

**Jhordam Aguilera** — Ingeniería en Informática
**Profesora:** ING. Dubraska Roca — Ingeniería de Software I, CIVA 2026

## Licencia

Proyecto académico — Ingeniería de Software I.
