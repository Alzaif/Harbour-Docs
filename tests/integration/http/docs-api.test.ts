import { describe, expect, it } from 'vitest';
import { createTestApp } from '../../helpers/test-app.js';
import { EMPTY_DOC_JSON } from '../../../src/shared/extract-plain-text.js';

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
});
