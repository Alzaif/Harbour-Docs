import { and, desc, eq, like, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port.js';
import type { Document, DocumentSummary } from '../../domain/entities/document.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { contentJsonEquals } from '../../shared/normalize-content-json.js';
import type { DocsDatabase } from './create-database.js';
import { documents } from './schema.js';

function mapRow(row: typeof documents.$inferSelect): Document {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    title: row.title,
    contentJson: row.contentJson,
    contentPlain: row.contentPlain,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSummary(row: typeof documents.$inferSelect): DocumentSummary {
  return {
    id: row.id,
    title: row.title,
    version: row.version,
    updatedAt: row.updatedAt,
  };
}

export class SqliteDocumentRepository implements DocumentRepositoryPort {
  constructor(
    private readonly db: DocsDatabase,
    private readonly clock: ClockPort,
  ) {}

  async list(ownerUserId: string, query?: string): Promise<readonly DocumentSummary[]> {
    const q = query?.trim();
    if (q) {
      const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
      const rows = await this.db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.ownerUserId, ownerUserId),
            or(like(documents.title, pattern), like(documents.contentPlain, pattern)),
          ),
        )
        .orderBy(desc(documents.updatedAt));
      return rows.map(mapSummary);
    }

    const rows = await this.db
      .select()
      .from(documents)
      .where(eq(documents.ownerUserId, ownerUserId))
      .orderBy(desc(documents.updatedAt));
    return rows.map(mapSummary);
  }

  async findById(ownerUserId: string, id: string): Promise<Document | null> {
    const rows = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerUserId, ownerUserId)))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(params: {
    ownerUserId: string;
    title: string;
    contentJson: string;
    contentPlain: string;
  }): Promise<Document> {
    const now = this.clock.now();
    const id = randomUUID();
    await this.db.insert(documents).values({
      id,
      ownerUserId: params.ownerUserId,
      title: params.title,
      contentJson: params.contentJson,
      contentPlain: params.contentPlain,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findById(params.ownerUserId, id))!;
  }

  async update(
    ownerUserId: string,
    id: string,
    expectedVersion: number,
    patch: { title?: string; contentJson?: string; contentPlain?: string },
  ): Promise<Document> {
    const existing = await this.findById(ownerUserId, id);
    if (!existing) throw new NotFoundError('Document not found');
    if (existing.version !== expectedVersion) {
      throw new ConflictError('Document version mismatch');
    }

    const nextTitle = patch.title ?? existing.title;
    const nextContentJson = patch.contentJson ?? existing.contentJson;
    const nextContentPlain = patch.contentPlain ?? existing.contentPlain;

    const titleUnchanged = nextTitle === existing.title;
    const contentUnchanged =
      patch.contentJson === undefined ||
      contentJsonEquals(nextContentJson, existing.contentJson);

    if (titleUnchanged && contentUnchanged) {
      return existing;
    }

    const now = this.clock.now();
    await this.db
      .update(documents)
      .set({
        title: nextTitle,
        contentJson: nextContentJson,
        contentPlain: nextContentPlain,
        version: existing.version + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.ownerUserId, ownerUserId),
          eq(documents.version, expectedVersion),
        ),
      );
    const updated = await this.findById(ownerUserId, id);
    if (!updated || updated.version !== existing.version + 1) {
      throw new ConflictError('Document version mismatch');
    }
    return updated;
  }

  async delete(ownerUserId: string, id: string): Promise<void> {
    await this.db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerUserId, ownerUserId)));
  }
}
