# Harbour Docs

Lite word processor for the Harbour platform: rich text editing, images, and export to PDF or DOCX.

## Features

A Google Docs–comparable lite word processor.

- Flat document library with search
- **Text:** headings (H1–H3), bold, italic, underline, strikethrough, inline code, superscript/subscript, text color, highlight, font family, font size, clear formatting
- **Paragraphs:** left/center/right/justify alignment, line spacing, bullet / numbered / checklist lists, indent in/out, block quote, code block, horizontal rule
- **Tables:** insert resizable tables with header row
- **Images:** upload, drag-corner resize handles, block alignment, and **text wrapping** (float left/right so text flows around the image), alt text
- **Tools:** find & replace (Ctrl+F), live word & character count
- Autosave with optimistic versioning
- **Import:** open `.odt` files (File → Open ODT…) — reads ODF `content.xml` for body text and extracts images from the package; Pandoc is used only as a fallback
- Export saved document as `.docx` or `.pdf` (marks, tables, task lists, rules, and image wrapping preserved; PDF omits the tab title as a body heading)

## Local development

```bash
cp config/env.example .env.local
npm install
npm run dev
```

- API: `http://localhost:3002`
- UI: `http://localhost:5175` (proxies `/api` to the API)

Without the gateway, `TRUST_GATEWAY_HEADERS=false` and `DEV_USER_*` in `.env.local` provide stub identity.

For ODT import in local API mode, no extra tools are required for typical Writer documents (native `content.xml` import). Install Pandoc on the host only if you need the fallback converter (`dnf install pandoc` / `apk add pandoc`).

## Stack

- Hono API + React/Vite UI
- SQLite + local attachment files
- TipTap editor; `docx` for Word export; Chromium + Playwright for PDF; Pandoc for ODT import

## Platform access

Grant users the docs app:

```bash
cd ../harbour-infra
./scripts/user-admin.sh users grant-app --email you@example.com --app docs
```

Add `127.0.0.1 docs.harbour.local` to `/etc/hosts`, then open `https://docs.harbour.local:8443` (Podman) after `./scripts/up.sh --build`.

See [docs/design/docs-mvp.md](docs/design/docs-mvp.md) for data model and export notes.
