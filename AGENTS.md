<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Project

Next.js 16 (App Router, RSC, Turbopack) + React 19 + TypeScript strict + Tailwind 4 + shadcn/Base UI. Backend is **Supabase** (Auth, Postgres+RLS, Realtime); no custom server. AI chatbot is a server-side API route.

Reply in English. User-facing copy/UI text is **Spanish**; keep it that way.

## Commands

```bash
npm install                 # .npmrc legacy-peer-deps=true is required (shadcn/@babel peer conflict)
npm run dev                 # :3000
npm run build
npm run lint                # eslint (flat config, eslint.config.mjs)
npm test                    # vitest run — ~39 tests, 8 files, jsdom, Supabase mocked
npx tsc --noEmit            # typecheck; tsconfig excludes tests/
```

- Tests need **no DB or network** — `tests/mocks/supabase-mock.ts` mocks the chainable Supabase query builder. Configure results with `setTableResults(table, { select | insert | update | delete })`; reset with `resetTableResults()`. Tests live under `tests/{components,hooks,lib,stores}` — the README's file list is stale; trust the directory.
- Single test: `npx vitest run tests/hooks/useChat.test.ts` or `-t "<name>"`.
- No lint→typecheck→test ordering requirement.
- `tsconfig.json` `exclude`s `tests/`, so `tsc --noEmit` does **not** cover tests; Vitest compiles them separately.

## Architecture (non-obvious bits)

- `src/app/(dashboard)/` = protected app; `src/app/admin/*` = admin-only, guarded client-side in `admin/layout.tsx` (`user.role !== 'admin'` → redirect `/`).
- `src/middleware.ts` only checks auth presence (redirects to `/login`); it does **not** check roles.
- **Permissions are defined once in `src/lib/permissions.ts`** (`can(role, capability)`, `isStaff`). When changing what a role can do, update this matrix **and** the Supabase RLS policies in `supabase-setup.sql`. UI matrix is not the source of truth for security.
- `src/lib/navigation.ts` holds `mainNav`/`adminNav`. Nav items are data, not markup.
- Supabase clients are split: `src/lib/supabase/client.ts` (browser), `server.ts` (RSC/route), `middleware.ts` (`updateSession`). Use the right one; do not import the service-role client into client components.
- Chatbot: `POST /api/chatbot` (`runtime = 'nodejs'`). Requires an authenticated user (401 otherwise). If `N8N_WEBHOOK_URL` is set it tries n8n first, then falls back to a direct OpenAI-compatible call (`CHATBOT_API_KEY`, default DeepSeek). 15s timeout → 504; provider error → 502 with friendly fallback. Bot replies are persisted to `chat_messages` only for sessions owned by the caller, using `CHATBOT_USER_ID` as `sender_id`. Intents in `unauthorized/error/timeout/connection_error/unavailable` are **not** persisted.
- Chat message ordering/merge logic lives in `src/lib/chat-messages.ts` (`mergeChatMessages` dedupes DB + optimistic temp messages).

## Environment

Copy `.env.example` → `.env.local`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (seed script + chatbot persistence), `CHATBOT_API_KEY`, `CHATBOT_USER_ID` (bot sender UUID in `public.users`). Optional: `CHATBOT_MODEL` (`deepseek-chat`), `CHATBOT_API_URL`, `NEXT_PUBLIC_N8N_WEBHOOK_URL`.

DB schema/RLS/triggers/pg_cron live in `supabase-setup.sql` — apply manually in the Supabase SQL editor; there are no migrations. Seed users: `.venv/bin/python scripts/seed-users.py` (idempotent, needs `SUPABASE_SERVICE_KEY`).

## Deploy

Vercel. `.vercelignore` excludes `docs*`, `tests`, `scripts`, `n8n-workflows`, `.venv`, `.codegraph` from uploads. `--type config` (not secret) is needed for `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the CLI rejects it.

## Informe del proyecto

El informe vive en `../docsInformeSoporte/` (fuera del repo, junto a este proyecto) y se escribe en Typst. **Cada vez que se modifique el informe hay que regenerar PDF *y* DOCX** (el DOCX es el formato de entrega):

```bash
.venv/bin/python scripts/build-informe.py
```

Genera `../docsInformeSoporte/informe-soporte.pdf` y `informe-soporte.docx` (más copia del DOCX en `docsInformeSoporte/`). El DOCX se produce vía Typst→HTML (`--features html`)→pandoc (`pypandoc-binary`), con las imágenes data-URI decodificadas a temporales para que queden embebidas.

**Nunca usar diagramas ASCII** en el informe. Los diagramas viven en `../docsInformeSoporte/diagrams/*.typ` (Typst + `@preview/fletcher`) y se compilan a PNG con `.venv/bin/python scripts/build-diagrams.py` (salida en `assets/diagrams/`). El informe los inserta con `#image(...)`. Regenerar diagramas antes de compilar si cambiaron.

Screenshots de tests: `scripts/capture-test-screenshots.py` (Playwright). El resto de scripts Python asumen un `.venv` con Typst, Playwright y `pypandoc-binary`.
