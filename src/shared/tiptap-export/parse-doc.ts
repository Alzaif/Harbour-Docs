export type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipTapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
};

export type ParsedDoc = {
  title: string;
  blocks: TipTapNode[];
};

export function parseTipTapDocument(contentJson: string, title: string): ParsedDoc {
  try {
    const doc = JSON.parse(contentJson) as TipTapNode;
    return { title, blocks: doc.content ?? [] };
  } catch {
    return { title, blocks: [] };
  }
}

export function attachmentIdFromSrc(src: string): string | null {
  const match = src.match(/\/api\/attachments\/([^/]+)\/content/);
  return match?.[1] ?? null;
}
