import { Hono } from 'hono';
import type { DocsDependencies } from '../../bootstrap/create-docs-dependencies.js';
import type { AppVariables } from './gateway-identity.js';
import { createGatewayIdentityMiddleware } from './gateway-identity.js';
import { handleError } from './error-handler.js';
import { ValidationError } from '../../shared/errors.js';

export function createApp(deps: DocsDependencies) {
  const app = new Hono();

  app.onError((err, c) => handleError(err, c));

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/version', (c) =>
    c.json({
      name: deps.config.PACKAGE_NAME,
      version: deps.config.PACKAGE_VERSION,
    }),
  );

  const api = new Hono<{ Variables: AppVariables }>();
  api.use('*', createGatewayIdentityMiddleware(deps.config, deps.users));

  api.get('/documents', async (c) => {
    const q = c.req.query('q');
    const list = await deps.documents.listDocuments(c.get('user'), q);
    return c.json(list);
  });

  api.post('/documents', async (c) => {
    const body = await c.req.json<{ title?: string }>().catch(() => ({}));
    const doc = await deps.documents.createDocument(c.get('user'), body);
    return c.json(doc, 201);
  });

  api.post('/documents/import/odt', async (c) => {
    const form = await c.req.parseBody();
    const file = form['file'];
    if (!file || typeof file === 'string') {
      throw new ValidationError('file is required');
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await deps.documents.importOdtDocument(c.get('user'), {
      mimeType: file.type || 'application/octet-stream',
      originalFilename: file.name || 'import.odt',
      data: buffer,
    }, { maxBytes: deps.config.IMPORT_MAX_BYTES });
    return c.json(doc, 201);
  });

  api.get('/documents/:id', async (c) => {
    const doc = await deps.documents.getDocument(c.get('user'), c.req.param('id'));
    return c.json(doc);
  });

  api.put('/documents/:id', async (c) => {
    const body = await c.req.json<{
      version: number;
      title?: string;
      contentJson?: string;
    }>();
    if (body.version === undefined) {
      throw new ValidationError('version is required');
    }
    const doc = await deps.documents.updateDocument(
      c.get('user'),
      c.req.param('id'),
      body.version,
      { title: body.title, contentJson: body.contentJson },
    );
    return c.json(doc);
  });

  api.delete('/documents/:id', async (c) => {
    await deps.documents.deleteDocument(c.get('user'), c.req.param('id'));
    return c.body(null, 204);
  });

  api.post('/documents/:id/attachments', async (c) => {
    const form = await c.req.parseBody();
    const file = form['file'];
    if (!file || typeof file === 'string') {
      throw new ValidationError('file is required');
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await deps.documents.uploadAttachment(
      c.get('user'),
      c.req.param('id'),
      {
        mimeType: file.type || 'application/octet-stream',
        originalFilename: file.name || 'upload',
        data: buffer,
      },
    );
    return c.json({ id: result.attachment.id, url: result.url }, 201);
  });

  api.get('/attachments/:id/content', async (c) => {
    const { data, mimeType } = await deps.documents.getAttachmentContent(
      c.get('user'),
      c.req.param('id'),
    );
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': mimeType },
    });
  });

  api.get('/documents/:id/export/docx', async (c) => {
    const { buffer, filename } = await deps.documents.exportDocx(
      c.get('user'),
      c.req.param('id'),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  });

  api.get('/documents/:id/export/pdf', async (c) => {
    if (!deps.config.EXPORT_PDF_ENABLED) {
      return c.json({ error: 'PDF export is disabled' }, 503);
    }
    const chromiumPath =
      deps.config.CHROMIUM_EXECUTABLE_PATH ?? '/usr/bin/chromium-browser';
    const { buffer, filename } = await deps.documents.exportPdf(
      c.get('user'),
      c.req.param('id'),
      chromiumPath,
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  });

  app.route('/api', api);

  return app;
}
