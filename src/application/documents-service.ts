import type { User } from '../domain/entities/user.js';
import type { Document, DocumentSummary } from '../domain/entities/document.js';
import type { Attachment } from '../domain/entities/attachment.js';
import type { DocumentRepositoryPort } from '../domain/ports/document-repository.port.js';
import type { AttachmentStorePort } from '../domain/ports/attachment-store.port.js';
import { NotFoundError, ValidationError } from '../shared/errors.js';
import { EMPTY_DOC_JSON, extractPlainText } from '../shared/extract-plain-text.js';
import { parseTipTapDocument } from '../shared/tiptap-export/parse-doc.js';
import { tiptapToDocxBuffer } from '../shared/tiptap-export/to-docx.js';
import { tiptapToPdfBuffer } from '../shared/tiptap-export/to-pdf.js';
import type { ImageResolver } from '../shared/tiptap-export/to-html.js';
import type { DocxImageResolver } from '../shared/tiptap-export/to-docx.js';

export interface DocumentsServiceDeps {
  documents: DocumentRepositoryPort;
  attachments: AttachmentStorePort;
}

export class DocumentsService {
  constructor(private readonly deps: DocumentsServiceDeps) {}

  listDocuments(user: User, query?: string): Promise<readonly DocumentSummary[]> {
    return this.deps.documents.list(user.id, query);
  }

  async createDocument(user: User, params?: { title?: string }): Promise<Document> {
    const title = (params?.title ?? 'Untitled').trim() || 'Untitled';
    return this.deps.documents.create({
      ownerUserId: user.id,
      title,
      contentJson: EMPTY_DOC_JSON,
      contentPlain: '',
    });
  }

  async getDocument(user: User, id: string): Promise<Document> {
    const doc = await this.deps.documents.findById(user.id, id);
    if (!doc) throw new NotFoundError('Document not found');
    return doc;
  }

  async updateDocument(
    user: User,
    id: string,
    expectedVersion: number,
    patch: { title?: string; contentJson?: string },
  ): Promise<Document> {
    const contentPlain =
      patch.contentJson !== undefined ? extractPlainText(patch.contentJson) : undefined;
    return this.deps.documents.update(user.id, id, expectedVersion, {
      ...(patch.title !== undefined ? { title: patch.title.trim() || 'Untitled' } : {}),
      ...(patch.contentJson !== undefined ? { contentJson: patch.contentJson } : {}),
      ...(contentPlain !== undefined ? { contentPlain } : {}),
    });
  }

  async deleteDocument(user: User, id: string): Promise<void> {
    await this.deps.attachments.deleteByDocument(user.id, id);
    await this.deps.documents.delete(user.id, id);
  }

  async uploadAttachment(
    user: User,
    documentId: string,
    file: { mimeType: string; originalFilename: string; data: Buffer },
  ): Promise<{ attachment: Attachment; url: string }> {
    await this.getDocument(user, documentId);
    if (!file.mimeType.startsWith('image/')) {
      throw new ValidationError('Only image uploads are supported');
    }
    const attachment = await this.deps.attachments.create({
      ownerUserId: user.id,
      documentId,
      mimeType: file.mimeType,
      originalFilename: file.originalFilename,
      data: file.data,
    });
    return {
      attachment,
      url: `/api/attachments/${attachment.id}/content`,
    };
  }

  async getAttachmentContent(
    user: User,
    id: string,
  ): Promise<{ data: Buffer; mimeType: string }> {
    const att = await this.deps.attachments.findById(user.id, id);
    if (!att) throw new NotFoundError('Attachment not found');
    const data = await this.deps.attachments.readContent(user.id, id);
    if (!data) throw new NotFoundError('Attachment file not found');
    return { data, mimeType: att.mimeType };
  }

  async exportDocx(user: User, documentId: string): Promise<{ buffer: Buffer; filename: string }> {
    const doc = await this.getDocument(user, documentId);
    const parsed = parseTipTapDocument(doc.contentJson, doc.title);
    const resolveImage = await this.buildDocxImageResolver(user, doc.contentJson);
    const buffer = await tiptapToDocxBuffer(parsed, resolveImage);
    return { buffer, filename: `${sanitizeFilename(doc.title)}.docx` };
  }

  async exportPdf(
    user: User,
    documentId: string,
    chromiumPath: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const doc = await this.getDocument(user, documentId);
    const parsed = parseTipTapDocument(doc.contentJson, doc.title);
    const resolveImage = await this.buildHtmlImageResolver(user, doc.contentJson);
    const buffer = await tiptapToPdfBuffer(parsed, resolveImage, chromiumPath);
    return { buffer, filename: `${sanitizeFilename(doc.title)}.pdf` };
  }

  private async buildHtmlImageResolver(
    user: User,
    contentJson: string,
  ): Promise<ImageResolver> {
    const bytes = await this.loadAttachmentBytes(user, contentJson);
    return (id) => {
      const hit = bytes.get(id);
      if (!hit) return null;
      return {
        dataUrl: `data:${hit.mimeType};base64,${hit.data.toString('base64')}`,
        mimeType: hit.mimeType,
      };
    };
  }

  private async buildDocxImageResolver(
    user: User,
    contentJson: string,
  ): Promise<DocxImageResolver> {
    const bytes = await this.loadAttachmentBytes(user, contentJson);
    return (id) => {
      const hit = bytes.get(id);
      return hit ? { data: hit.data } : null;
    };
  }

  private async loadAttachmentBytes(
    user: User,
    contentJson: string,
  ): Promise<Map<string, { data: Buffer; mimeType: string }>> {
    const ids = new Set<string>();
    const re = /\/api\/attachments\/([^/]+)\/content/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(contentJson)) !== null) {
      ids.add(m[1]!);
    }

    const bytes = new Map<string, { data: Buffer; mimeType: string }>();
    for (const id of ids) {
      try {
        bytes.set(id, await this.getAttachmentContent(user, id));
      } catch {
        /* skip missing */
      }
    }
    return bytes;
  }
}

function sanitizeFilename(title: string): string {
  const base = title.trim() || 'document';
  return base.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'document';
}
