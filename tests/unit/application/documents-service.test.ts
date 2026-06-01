import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DocumentsService } from '../../../src/application/documents-service.js';
import { SystemClock } from '../../../src/infrastructure/adapters/system-clock.js';
import { createDatabase } from '../../../src/infrastructure/persistence/create-database.js';
import { SqliteUserRepository } from '../../../src/infrastructure/persistence/sqlite-user-repository.js';
import { SqliteDocumentRepository } from '../../../src/infrastructure/persistence/sqlite-document-repository.js';
import { LocalFilesystemAttachmentStore } from '../../../src/infrastructure/storage/local-filesystem-attachment-store.js';
import { EMPTY_DOC_JSON } from '../../../src/shared/extract-plain-text.js';
import { ConflictError } from '../../../src/shared/errors.js';

function createService() {
  const dir = mkdtempSync(join(tmpdir(), 'docs-unit-'));
  const { db } = createDatabase(join(dir, 'test.db'));
  const clock = new SystemClock();
  const users = new SqliteUserRepository(db, clock);
  const documents = new SqliteDocumentRepository(db, clock);
  const attachments = new LocalFilesystemAttachmentStore(db, clock, dir);
  const service = new DocumentsService({ documents, attachments });
  return { service, users };
}

describe('DocumentsService', () => {
  it('scopes data per user', async () => {
    const { service, users } = createService();
    const alice = await users.upsertFromGateway({ id: 'alice', email: 'alice@test' });
    const bob = await users.upsertFromGateway({ id: 'bob', email: 'bob@test' });

    await service.createDocument(alice);
    const bobList = await service.listDocuments(bob);
    expect(bobList).toHaveLength(0);
  });

  it('does not increment version when content is unchanged', async () => {
    const { service, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u1', email: 'u1@test' });
    const doc = await service.createDocument(user, { title: 'Same' });
    const unchanged = await service.updateDocument(user, doc.id, 1, {
      contentJson: doc.contentJson,
      title: 'Same',
    });
    expect(unchanged.version).toBe(1);
  });

  it('increments version on real edit', async () => {
    const { service, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u2', email: 'u2@test' });
    const doc = await service.createDocument(user);
    const updated = await service.updateDocument(user, doc.id, 1, {
      title: 'Changed',
      contentJson: EMPTY_DOC_JSON,
    });
    expect(updated.version).toBe(2);
    await expect(
      service.updateDocument(user, doc.id, 1, { title: 'Stale' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('exports docx buffer', async () => {
    const { service, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u3', email: 'u3@test' });
    const doc = await service.createDocument(user, { title: 'Export Me' });
    const { buffer, filename } = await service.exportDocx(user, doc.id);
    expect(filename).toMatch(/\.docx$/);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
