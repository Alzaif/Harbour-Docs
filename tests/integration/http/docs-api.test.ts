import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../../helpers/test-app.js';
import { EMPTY_DOC_JSON } from '../../../src/shared/extract-plain-text.js';

function createSampleOdt(): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'odt-api-'));
  mkdirSync(join(dir, 'META-INF'), { recursive: true });

  writeFileSync(join(dir, 'mimetype'), 'application/vnd.oasis.opendocument.text');
  writeFileSync(
    join(dir, 'content.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">Imported heading</text:h>
      <text:p>Imported paragraph text.</text:p>
    </office:text>
  </office:body>
</office:document-content>`,
  );
  writeFileSync(
    join(dir, 'META-INF', 'manifest.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`,
  );

  const odtPath = join(dir, 'import-test.odt');
  execSync(
    `cd "${dir}" && zip -X -0 "${odtPath}" mimetype && zip -X "${odtPath}" content.xml META-INF/manifest.xml`,
  );
  return readFileSync(odtPath);
}

describe('Docs API', () => {
  it('returns health without auth', async () => {
    const { app } = await createTestApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('creates and updates a document', async () => {
    const { app } = await createTestApp();

    const createRes = await app.request('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Doc' }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; version: number };
    expect(created.version).toBe(1);

    const updateRes = await app.request(`/api/documents/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 1,
        title: 'My Doc',
        contentJson: EMPTY_DOC_JSON,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { version: number };
    expect(updated.version).toBe(1);
  });

  it('exports docx', async () => {
    const { app } = await createTestApp();

    const createRes = await app.request('/api/documents', { method: 'POST' });
    const doc = (await createRes.json()) as { id: string };

    const exportRes = await app.request(`/api/documents/${doc.id}/export/docx`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.headers.get('Content-Type')).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    const buf = Buffer.from(await exportRes.arrayBuffer());
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it('imports ODT via multipart upload using native content.xml', async () => {
    const { app } = await createTestApp();
    const odtBytes = createSampleOdt();
    const form = new FormData();
    form.append('file', new Blob([odtBytes]), 'import-test.odt');

    const res = await app.request('/api/documents/import/odt', {
      method: 'POST',
      body: form,
    });
    expect(res.status).toBe(201);
    const doc = (await res.json()) as { title: string; contentJson: string };
    expect(doc.title).toBe('import-test');
    const content = JSON.parse(doc.contentJson) as {
      content: Array<{ type: string; content?: Array<{ text?: string }> }>;
    };
    expect(content.content.some((n) => n.type === 'heading')).toBe(true);
    expect(content.content.some((n) => n.type === 'paragraph')).toBe(true);
    const allText = JSON.stringify(content);
    expect(allText).toContain('Imported paragraph text');
  });
});
