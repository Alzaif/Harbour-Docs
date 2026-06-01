# Harbour Docs

Lite word processor for the Harbour platform: rich text editing, images, and export to PDF or DOCX.

## Features (MVP)

- Flat document library with search
- Rich text: headings, bold/italic/underline, lists, blockquote, font family, alignment
- Images: upload, drag to reposition, align, resize width
- Autosave with optimistic versioning
- Export saved document as `.docx` or `.pdf`

## Local development

```bash
cp config/env.example .env.local
npm install
npm run dev
```

- API: `http://localhost:3002`
- UI: `http://localhost:5175` (proxies `/api` to the API)

Without the gateway, `TRUST_GATEWAY_HEADERS=false` and `DEV_USER_*` in `.env.local` provide stub identity.

## Stack

- Hono API + React/Vite UI
- SQLite + local attachment files
- TipTap editor; `docx` for Word export; Chromium + Playwright for PDF

## Platform access

Grant users the docs app:

```bash
cd ../harbour-infra
./scripts/user-admin.sh users grant-app --email you@example.com --app docs
```

Add `127.0.0.1 docs.harbour.local` to `/etc/hosts`, then open `https://docs.harbour.local:8443` (Podman) after `./scripts/up.sh --build`.

See [docs/design/docs-mvp.md](docs/design/docs-mvp.md) for data model and export notes.
