import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDocsDependencies } from '../../src/bootstrap/create-docs-dependencies.js';
import { createApp } from '../../src/infrastructure/http/app.js';

export async function createTestApp() {
  const dir = mkdtempSync(join(tmpdir(), 'docs-test-'));
  const deps = await createDocsDependencies({
    ...process.env,
    DOCS_DB_PATH: join(dir, 'test.db'),
    DOCS_DATA_DIR: dir,
    TRUST_GATEWAY_HEADERS: 'false',
    DEV_USER_ID: 'test-user',
    DEV_USER_EMAIL: 'test@harbour.local',
    EXPORT_PDF_ENABLED: 'false',
  });
  const app = createApp(deps);
  return { app, deps };
}
