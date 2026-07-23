# Harbour Docs MVP

**Scope:** Lite word processor — flat document library, TipTap editor, PDF/DOCX export.

## Data model

| Entity | Notes |
|--------|--------|
| `users` | Upserted from gateway headers |
| `documents` | `title`, `content_json` (TipTap), `content_plain`, `version` |
| `attachments` | Images on disk; referenced in editor as `/api/attachments/:id/content` |

## Editor

TipTap v3. The editor aims for parity with the Google Docs toolbar.

**Extensions**

| Concern | Extensions |
|---------|-----------|
| Base | StarterKit (bold, italic, strike, code, code block, blockquote, lists, headings, horizontal rule) |
| Inline marks | underline, subscript, superscript, color (via TextStyle), highlight (multicolor), font family, font size |
| Blocks | line-height (custom), task list / task item, table (+ row, header, cell, resizable) |
| Media | `CustomImage` — width/height, block `align`, and `wrap` (`none`/`left`/`right`) |
| Tooling | character-count (word/char status bar), placeholder |

**Menu bar (`DocsMenuBar`):** functional File / Edit / View / Insert / Format / Tools / Help dropdowns. The editor instance is lifted to `App` (via `onEditorReady`) and image-insert / find actions are exposed through an `actionsRef`, so menu items run real editor commands (with live active/disabled state and shortcut hints).

**Toolbar groups:** undo/redo/print/find · style + font + size · bold/italic/underline/strike + color + highlight · super/subscript + inline code + clear formatting · link/image/table/HR · alignment + line spacing · lists/checklist/quote/code block/indent · editing mode.

**Image UX (beyond Google Docs inline controls):**

- React node view renders drag-to-resize corner handles (proportional, 60–1000px).
- A contextual image toolbar appears when an image is selected: wrap mode (in-line, wrap left, wrap right), block alignment, width slider, reset size, alt text, delete.
- `wrap: left|right` floats the image so body text flows around it.

**Find & replace:** `collectMatches` walks the ProseMirror doc for literal (non-regex) matches with absolute positions; supports next/prev navigation, replace current, replace all, and match-case. Opened with the toolbar button or Ctrl+F.

## Export

| Format | Path | Implementation |
|--------|------|----------------|
| DOCX | `GET /api/documents/:id/export/docx` | Walk TipTap JSON → `docx` package |
| PDF | `GET /api/documents/:id/export/pdf` | TipTap → HTML → Chromium `page.pdf()` |

PDF export renders **editor content only** — the document tab title is not injected as a body heading (it remains in HTML `<title>` metadata and the download filename). DOCX export still includes the document title as a Word title paragraph.

## Import

| Format | Path | Implementation |
|--------|------|----------------|
| ODT | `POST /api/documents/import/odt` | Native `content.xml` parser (primary) → HTML → TipTap JSON; Pandoc fallback |

- File menu: **Open ODT…** uploads a `.odt` file; tab title comes from the filename (without extension), not prepended as editor content.
- Per the ODF package layout, body text lives in **`content.xml`** (`text:h`, `text:p`, lists, tables); embedded binaries (images) live under **`Pictures/`** and are referenced from `draw:frame` / `draw:image` nodes.
- The native importer reads `content.xml` directly so Writer body copy is not lost when Pandoc omits it or requires missing `styles.xml`.
- Embedded images are extracted from the ODT ZIP, stored as attachments, and rewritten to `/api/attachments/:id/content` before TipTap conversion.
- Pandoc remains as a fallback for edge cases (`PANDOC_PATH`, default `pandoc`); included in the production Docker image.
- Max upload size: `IMPORT_MAX_BYTES` (default 20MB).

Both exporters cover headings (H1–H6), all inline marks (bold/italic/underline/strike/sub/super/code, color, highlight, font, size), lists, task lists, block quotes, code blocks, horizontal rules, tables (with header shading and col/row spans), and images (with wrap-derived alignment). Export uses **saved** database content (not the unsaved editor buffer).

### Export limitations

- DOCX floats images via paragraph alignment rather than true text-wrap anchoring; PDF/HTML preserve CSS float wrapping.
- Complex Word layout (multi-column, precise anchored objects) is not guaranteed.
- PDF requires Chromium in the container (`CHROMIUM_EXECUTABLE_PATH`); disable with `EXPORT_PDF_ENABLED=false`.

## Auth

- Scope: `app:docs`
- Host: `docs.harbour.local`
- Same ForwardAuth + gateway header pattern as harbour-notes.
