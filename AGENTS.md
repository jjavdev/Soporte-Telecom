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

## Informe del proyecto

El informe vive en `../docsInformeSoporte/` (fuera del repo, junto a este proyecto) y se escribe en Typst. **Cada vez que se modifique el informe hay que regenerar PDF *y* DOCX** (el DOCX es el formato de entrega):

```bash
.venv/bin/python scripts/build-informe.py
```

Genera `../docsInformeSoporte/informe-soporte.pdf` y `informe-soporte.docx` (más copia del DOCX en `docsInformeSoporte/`). El DOCX se produce vía Typst→HTML (`--features html`)→pandoc (`pypandoc-binary`), con las imágenes data-URI decodificadas a temporales para que queden embebidas.

**Nunca usar diagramas ASCII** en el informe. Los diagramas viven en `../docsInformeSoporte/diagrams/*.typ` (Typst + `@preview/fletcher`) y se compilan a PNG con `.venv/bin/python scripts/build-diagrams.py` (salida en `assets/diagrams/`). El informe los inserta con `#image(...)`. Regenerar diagramas antes de compilar si cambiaron.

Screenshots de tests: `scripts/capture-test-screenshots.py` (Playwright).

## Working mode

- Reply in English. Use caveman full compression (terse, no filler; technical substance intact).
- Apply ponytail for all code: stdlib/native first, shortest working diff, no unrequested abstractions.
- Use codegraph MCP (`codegraph_explore`) before grep/read on indexed code; use context7 for library docs. Both save tokens.
