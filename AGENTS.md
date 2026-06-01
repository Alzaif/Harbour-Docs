# Harbour Docs — agent notes

Hexagonal TypeScript app (Hono API + React/Vite UI). Clone patterns from `harbour-notes` when extending platform integration.

- **Scope:** `app:docs` on `docs.harbour.local`
- **Data:** SQLite `documents` + filesystem attachments under `DOCS_DATA_DIR`
- **Export:** `src/shared/tiptap-export/` (HTML, DOCX, PDF via Chromium)
- **Design:** [docs/design/docs-mvp.md](docs/design/docs-mvp.md)
