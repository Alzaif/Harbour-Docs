# Harbour Docs MVP

**Scope:** Lite word processor — flat document library, TipTap editor, PDF/DOCX export.

## Data model

| Entity | Notes |
|--------|--------|
| `users` | Upserted from gateway headers |
| `documents` | `title`, `content_json` (TipTap), `content_plain`, `version` |
| `attachments` | Images on disk; referenced in editor as `/api/attachments/:id/content` |

## Editor

- TipTap v3: StarterKit, underline, font family, text align, custom image (width + align attrs).
- Images: upload via multipart; drag to reorder in document; align left/center/right; width slider when image selected.

## Export

| Format | Path | Implementation |
|--------|------|----------------|
| DOCX | `GET /api/documents/:id/export/docx` | Walk TipTap JSON → `docx` package |
| PDF | `GET /api/documents/:id/export/pdf` | TipTap → HTML → Chromium `page.pdf()` |

Export uses **saved** database content (not unsaved editor buffer).

### Limitations

- DOCX/PDF target typical prose + images; complex Word layout (columns, precise wrap) not guaranteed.
- PDF requires Chromium in the container (`CHROMIUM_EXECUTABLE_PATH`); disable with `EXPORT_PDF_ENABLED=false`.

## Auth

- Scope: `app:docs`
- Host: `docs.harbour.local`
- Same ForwardAuth + gateway header pattern as harbour-notes.
