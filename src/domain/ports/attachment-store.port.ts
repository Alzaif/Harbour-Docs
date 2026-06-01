import type { Attachment } from '../entities/attachment.js';

export interface AttachmentStorePort {
  create(params: {
    ownerUserId: string;
    documentId: string;
    mimeType: string;
    originalFilename: string;
    data: Buffer;
  }): Promise<Attachment>;
  findById(ownerUserId: string, id: string): Promise<Attachment | null>;
  readContent(ownerUserId: string, id: string): Promise<Buffer | null>;
  deleteByDocument(ownerUserId: string, documentId: string): Promise<void>;
  delete(ownerUserId: string, id: string): Promise<void>;
}
