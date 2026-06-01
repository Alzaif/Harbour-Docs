import type { Document, DocumentSummary } from '../entities/document.js';

export interface DocumentRepositoryPort {
  list(ownerUserId: string, query?: string): Promise<readonly DocumentSummary[]>;
  findById(ownerUserId: string, id: string): Promise<Document | null>;
  create(params: {
    ownerUserId: string;
    title: string;
    contentJson: string;
    contentPlain: string;
  }): Promise<Document>;
  update(
    ownerUserId: string,
    id: string,
    expectedVersion: number,
    patch: { title?: string; contentJson?: string; contentPlain?: string },
  ): Promise<Document>;
  delete(ownerUserId: string, id: string): Promise<void>;
}
