# Soporte Telecom

Sistema integral de soporte al cliente para el sector de telecomunicaciones. Permite gestionar tickets, chat en tiempo real con chatbot Nivel 1, base de conocimiento y panel de administración con métricas.

**Proyecto académico** — Ingeniería de Software I · ING. Dubraska Roca · CIVA 2026

---

## Objetivo

Reducir la saturación del soporte de primer nivel implementando un chatbot con inteligencia artificial que resuelva incidencias simples automáticamente (reinicio de router, cambio de clave Wi-Fi, consulta de saldo) y escale a agentes humanos cuando sea necesario.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js (App Router) | 16.3.4 |
| UI | React | 19.2.8 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Estado global | Zustand | 5.x |
| Formularios | React Hook Form + Zod | 7.x / 3.x |
| Base de Datos | Supabase (PostgreSQL, Auth, Realtime, RLS) | — |
| IA Chatbot | Google Gemini API (gemini-2.5-flash) | — |
| Automatización | n8n (Docker, 1 workflow) + Supabase native (triggers + pg_cron) | — |
| Despliegue | Vercel | — |

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                  │
│  Next.js 16 · React 19 · Tailwind · Zustand         │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │Dashboard │ │ Tickets  │ │   Chat   │ │  Admin  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
└───────┼─────────────┼───────────┼─────────────┼──────┘
        │             │           │             │
        ▼             ▼           ▼             ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (BaaS)                         │
│  PostgreSQL · Auth · Realtime · Row Level Security   │
│  8 tablas · RLS por rol · Realtime subscriptions    │
└─────────────────────────────────────────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│   n8n (Docker)   │              │  Webhook n8n     │
│   localhost:5678 │◄────────────│  /webhook/chatbot│
│                   │              │                  │
│  1 workflow:     │              │  Chatbot N1:     │
│  · Chatbot       │              │  · Gemini AI     │
│                  │              │  · IA real       │
│                  │              └──────────────────┘
└──────────────────┘
```

## Funcionalidades

### Cliente
- **Autenticación** — Registro e inicio de sesión con Supabase Auth
- **Tickets** — Crear, listar y dar seguimiento a tickets de soporte
- **Chat en Vivo** — Chatbot Nivel 1 con IA + escalamiento a agente humano
- **Base de Conocimiento** — Artículos de auto-servicio por categorías

### Agente
- **Gestión de Tickets** — Listar, filtrar y atender tickets asignados
- **Comentarios** — Agregar notas públicas e internas a tickets
- **Chat** — Atender sesiones de chat en tiempo real

### Administrador
- **Dashboard** — Métricas en tiempo real (tickets, satisfacción, SLA)
- **Gestión de Usuarios** — Crear, editar y desactivar agentes
- **Reportes** — Generar reportes de rendimiento del equipo
- **Configuración** — Categorías, prioridades y reglas de SLA

## Estructura del Proyecto

```
soporte-telecom/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Login, Register
│   │   ├── (dashboard)/            # Panel principal
│   │   │   ├── page.tsx            # Dashboard con métricas
│   │   │   ├── tickets/            # CRUD de tickets
│   │   │   ├── chat/               # Chat con bot + agentes
│   │   │   └── knowledge/          # Base de conocimiento
│   │   └── admin/                  # Panel de administración
│   │       ├── page.tsx            # Dashboard admin
│   │       ├── users/              # Gestión de usuarios
│   │       └── reports/            # Reportes
│   ├── components/common/          # UI reutilizable
│   │   ├── Button.tsx              # Botón con variantes + loading
│   │   ├── Card.tsx                # Tarjeta con hover opcional
│   │   ├── Input.tsx               # Input con label + error
│   │   ├── Modal.tsx               # Modal con overlay
│   │   └── Badge.tsx               # Badge con colores por variante
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.ts              # Autenticación + sesión
│   │   ├── useChat.ts              # Chat con Supabase Realtime
│   │   └── useTickets.ts           # CRUD tickets con filtros
│   ├── stores/
│   │   └── authStore.ts            # Estado global (Zustand)
│   ├── lib/
│   │   ├── constants.ts            # statusColors, roleColors
│   │   ├── utils.ts                # cn() helper
│   │   └── supabase/               # Client, Server, Middleware
│   ├── types/
│   │   └── database.ts             # Tipos TypeScript del schema
│   └── middleware.ts                # Auth middleware (Next.js)
├── n8n-workflows/                  # 1 workflow: Chatbot Gemini (04-chatbot-nivel1.json)
│   ├── 01-auto-assign-ticket.json
│   ├── 02-notify-email-ticket.json
│   ├── 03-escalate-sla.json
│   └── 04-chatbot-nivel1.json
├── supabase-setup.sql              # Schema completo + RLS + triggers
├── docker-compose.yml              # n8n en Docker
├── docs/                           # Documentación Typst (informe)
├── .env.example                    # Template de variables de entorno
└── .env.docker.example             # Template para Docker (n8n)
```

## Variables de Entorno

### Frontend (`.env.local`)

| Variable | Descripción | Ejemplo |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | `eyJhbG...` |
| `SUPABASE_SERVICE_KEY` | Service key (solo server-side) | `eyJhbG...` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | URL del webhook de n8n | `http://localhost:5678` |
| `GEMINI_API_KEY` | API key de Google Gemini para chatbot IA | `AQ.Ab8...` |

### Docker — n8n (`.env` en raíz)

| Variable | Descripción | Ejemplo |
|----------|------------|---------|
| `N8N_BASIC_AUTH_USER` | Usuario de autenticación n8n | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Contraseña de autenticación n8n | `tu-password` |
| `SUPABASE_URL` | URL de Supabase para workflows | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service key para workflows | `eyJhbG...` |
| `GEMINI_API_KEY` | API key de Google Gemini para chatbot | `AQ.Ab8...` |

> **Nota:** Nunca commitees archivos `.env` o `.env.local`. Ya están en `.gitignore`.

## Instalación

### Requisitos previos
- Node.js 18+
- Docker (para n8n)
- Cuenta de Supabase (supabase.com)
- API key de Google Gemini (aistudio.google.com/apikey)

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/soporte-telecom.git
cd soporte-telecom
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno
```bash
cp .env.example .env.local
```
Editar `.env.local` con tus credenciales de Supabase y Gemini API key.

### Paso 4: Configurar base de datos
Ir al SQL Editor de Supabase y ejecutar el contenido de `supabase-setup.sql`.

Esto crea:
- 8 tablas principales
- Row Level Security (RLS) en todas las tablas
- Trigger para crear usuario automáticamente al registrarse
- Función para actualizar `updated_at`

### Paso 5: Iniciar n8n
```bash
cp .env.example .env.docker   # Crear .env para Docker
# Editar .env con tus credenciales de Supabase y Gemini API key
docker compose up -d
```
Acceder a http://localhost:5678 e importar los workflows de `n8n-workflows/`.

### Paso 6: Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abrir http://localhost:3000

## Base de Datos

8 tablas principales con Row Level Security (RLS):

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │────<│   tickets    │────<│   comments   │
│              │     │              │     │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ email        │     │ title        │     │ ticket_id FK │
│ full_name    │     │ description  │     │ author_id FK │
│ role         │     │ status       │     │ content      │
│ phone        │     │ priority     │     │ type         │
│ status       │     │ client_id FK │     └──────────────┘
└──────────────┘     │ agent_id FK  │
                     │ category_id FK│
┌──────────────┐     └──────────────┘
│ categories   │
│              │     ┌──────────────┐     ┌──────────────┐
│ id (PK)      │     │chat_sessions │────<│chat_messages │
│ name         │     │              │     │              │
│ slug         │     │ id (PK)      │     │ id (PK)      │
│ description  │     │ client_id FK │     │ session_id FK│
└──────────────┘     │ agent_id FK  │     │ sender_id FK │
                     │ status       │     │ content      │
┌──────────────┐     └──────────────┘     └──────────────┘
│knowledge_art.│
│              │     ┌──────────────┐
│ id (PK)      │     │notifications │
│ title        │     │              │
│ content      │     │ id (PK)      │
│ category_id FK│     │ user_id FK   │
│ views        │     │ type         │
└──────────────┘     │ read         │
                     └──────────────┘
```

## Chatbot Nivel 1 (Gemini AI)

El chatbot integra inteligencia artificial real mediante **Google Gemini API** (modelo `gemini-2.5-flash`) para clasificar intenciones y responder automáticamente. A diferencia de los chatbots basados en regex, este utiliza un modelo de lenguaje que comprende el contexto del usuario.

### Flujo del chatbot

```
Usuario → Webhook n8n → HTTP Request (Gemini API) → Parse JSON → Respuesta
```

**Arquitectura:**
- **Webhook** recibe el mensaje del usuario
- **HTTP Request** envía el mensaje + system instruction a Gemini API
- **Code Node** parsea la respuesta JSON de Gemini (elimina code fences markdown)
- **RespondToWebhook** retorna la respuesta al frontend

### Intenciones soportadas

| # | Intención | Descripción |
|---|-----------|-------------|
| 1 | `greeting` | El usuario saluda |
| 2 | `check_ticket_status` | Quiere consultar estado de ticket |
| 3 | `create_ticket` | Necesita crear ticket de soporte |
| 4 | `faq` | Preguntas frecuentes (router, WiFi, saldo) |
| 5 | `business_hours` | Consulta horario de atención |
| 6 | `escalate_to_human` | Quiere hablar con agente humano |
| 7 | `unknown` | No se pudo determinar intención |

### Acciones disponibles

| Acción | Descripción |
|--------|-------------|
| `redirect_tickets` | Redirigir a sección de tickets |
| `escalate` | Escalar a agente humano |
| `null` | Sin acción adicional |

### System Prompt

El chatbot utiliza un system prompt que define:
- Rol: asistente de soporte telecom
- Estructura de respuesta JSON
- Intenciones y acciones disponibles
- Reglas de comportamiento

## Automatizaciones

### n8n (1 workflow activo)

| Workflow | Trigger | Acción |
|----------|---------|--------|
| Chatbot Nivel 1 | Webhook POST `/webhook/chatbot` | Gemini AI clasifica intención y responde |

### Supabase nativo (PostgreSQL triggers + pg_cron)

| Automatización | Tipo | Descripción |
|----------------|------|-------------|
| Auto-asignación | `BEFORE INSERT` trigger | Asigna agente activo con menor carga + fija SLA deadline |
| Notificación in-app | `AFTER UPDATE` trigger | Notifica al cliente cuando cambia el estado del ticket |
| Escalamiento SLA | `pg_cron` (cada 5 min) | Escala a urgente los tickets que superaron su plazo SLA |

### Configuración

**n8n:**
1. Acceder a http://localhost:5678
2. Ir a **Workflows** → **Import from File**
3. Importar `n8n-workflows/04-chatbot-nivel1.json`
4. Activar el workflow

**Supabase:**
1. Ejecutar `supabase-setup.sql` en el SQL Editor
2. Habilitar extensión `pg_cron`: Database > Extensions > pg_cron
3. Re-ejecutar la sección 10.3 para registrar el job `escalar-sla`

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `customer` | Crear tickets, ver propio historial, chatear con bot/agente |
| `agent` | Atender tickets asignados, agregar comentarios, gestionar chat |
| `supervisor` | Ver métricas, escalar tickets, supervisar agentes |
| `admin` | Gestión completa: usuarios, categorías, SLA, reportes |

## Despliegue

### Vercel (recomendado)
```bash
npm run build
```
El proyecto está optimizado para Vercel. Conectar el repositorio de GitHub en vercel.com para despliegue automático.

### Desarrollo local
```bash
npm run dev     # Puerto 3000
docker compose up -d  # n8n en puerto 5678
```

## Troubleshooting

### El chatbot no responde
- Verificar que n8n esté corriendo: `docker compose ps`
- Verificar la URL del webhook en `.env.local`: `NEXT_PUBLIC_N8N_WEBHOOK_URL`
- Importar y activar el workflow `04-chatbot-nivel1.json` en n8n

### Error de autenticación
- Verificar que `supabase-setup.sql` fue ejecutado correctamente
- Confirmar que el trigger `on_auth_user_created` existe
- Verificar las credenciales en `.env.local`

### La app no compila
```bash
npm run build
```
Si hay errores de TypeScript, ejecutar `npx tsc --noEmit` para ver detalles.

### n8n no inicia
```bash
docker compose logs n8n
```
Verificar que el archivo `.env` existe en la raíz con las credenciales correctas.

### Los cambios no se reflejan en tiempo real
- Verificar la suscripción Realtime en Supabase
- Confirmar que la tabla tiene habilitada la replicación

## Documentación Adicional

El informe completo del proyecto está en `docs/` escrito en Typst:
- `docs/informe.typ` — Documento principal
- `docs/01-introduccion.typ` — Introducción
- `docs/02-analisis.typ` — Análisis del sistema
- `docs/03-diseno.typ` — Diseño de la solución
- `docs/04-implementacion.typ` — Detalles de implementación
- `docs/05-uso-ia.typ` — Uso de inteligencia artificial
- `docs/06-pruebas.typ` — Plan de pruebas
- `docs/07-despliegue.typ` — Estrategia de despliegue
- `docs/08-mantenimiento.typ` — Mantenimiento
- `docs/09-automatizaciones-n8n.typ` — Automatizaciones n8n
- `docs/10-evidencia.typ` — Evidencia funcional
- `docs/11-conclusiones.typ` — Conclusiones

## Profesora

**ING. Dubraska Roca** — Ingeniería de Software I, CIVA 2026

## Licencia

Proyecto académico — Ingeniería de Software I
