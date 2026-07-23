import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DocumentsService } from '../application/documents-service.js';
import { SystemClock } from '../infrastructure/adapters/system-clock.js';
import { loadConfig, type DocsConfig } from '../infrastructure/config/load-config.js';
import { createDatabase } from '../infrastructure/persistence/create-database.js';
import { SqliteUserRepository } from '../infrastructure/persistence/sqlite-user-repository.js';
import { SqliteDocumentRepository } from '../infrastructure/persistence/sqlite-document-repository.js';
import { LocalFilesystemAttachmentStore } from '../infrastructure/storage/local-filesystem-attachment-store.js';
import { PandocOdtConverter } from '../infrastructure/conversion/pandoc-odt-converter.js';
import {
  CompositeOdtConverter,
  OdfNativeOdtConverter,
} from '../infrastructure/conversion/odf-native-odt-converter.js';

export interface DocsDependencies {
  config: DocsConfig;
  users: SqliteUserRepository;
  documents: DocumentsService;
}

export async function createDocsDependencies(
  env: NodeJS.ProcessEnv = process.env,
): Promise<DocsDependencies> {
  const config = loadConfig(env);
  await mkdir(config.DATA_DIR, { recursive: true });
  await mkdir(dirname(config.DB_PATH), { recursive: true });

  const { db } = createDatabase(config.DB_PATH);
  const clock = new SystemClock();
  const users = new SqliteUserRepository(db, clock);
  const documentRepo = new SqliteDocumentRepository(db, clock);
  const attachments = new LocalFilesystemAttachmentStore(db, clock, config.DATA_DIR);
  const pandoc = new PandocOdtConverter({ pandocPath: config.PANDOC_PATH });
  const converter = new CompositeOdtConverter(new OdfNativeOdtConverter(), pandoc);
  const documents = new DocumentsService({ documents: documentRepo, attachments, converter });

  return { config, users, documents };
}
