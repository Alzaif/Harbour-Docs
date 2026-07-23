import type { Document, DocumentSummary } from './types.js';
import { apiUrl } from './app-path.js';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listDocuments(query?: string): Promise<DocumentSummary[]> {
    const q = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    return request(`/api/documents${q}`);
  },

  createDocument(title?: string): Promise<Document> {
    return request('/api/documents', {
      method: 'POST',
      body: JSON.stringify(title ? { title } : {}),
    });
  },

  getDocument(id: string): Promise<Document> {
    return request(`/api/documents/${id}`);
  },

  updateDocument(
    id: string,
    body: { version: number; title?: string; contentJson?: string },
  ): Promise<Document> {
    return request(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  deleteDocument(id: string): Promise<void> {
    return request(`/api/documents/${id}`, { method: 'DELETE' });
  },

  async uploadImage(documentId: string, file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(apiUrl(`/api/documents/${documentId}/attachments`), {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Upload failed');
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  },

  exportDocx(documentId: string): void {
    window.location.assign(apiUrl(`/api/documents/${documentId}/export/docx`));
  },

  exportPdf(documentId: string): void {
    window.location.assign(apiUrl(`/api/documents/${documentId}/export/pdf`));
  },

  async importOdt(file: File): Promise<Document> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(apiUrl('/api/documents/import/odt'), {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Import failed');
    }
    return res.json() as Promise<Document>;
  },
};
