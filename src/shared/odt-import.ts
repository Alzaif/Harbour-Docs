import { readFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, resolve } from 'node:path';

const ODT_MIME = 'application/vnd.oasis.opendocument.text';

const EXT_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export function isValidOdtUpload(file: {
  originalFilename: string;
  mimeType: string;
}): boolean {
  const ext = extname(file.originalFilename).toLowerCase();
  if (ext === '.odt') return true;
  return file.mimeType === ODT_MIME;
}

export function titleFromOdtFilename(filename: string): string {
  const base = basename(filename);
  if (base.toLowerCase().endsWith('.odt')) {
    return base.slice(0, -4).trim() || 'Untitled';
  }
  return base.trim() || 'Untitled';
}

function mimeFromFilename(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}

export async function rewriteHtmlImageSources(
  html: string,
  workDir: string,
  uploadImage: (file: {
    mimeType: string;
    originalFilename: string;
    data: Buffer;
  }) => Promise<string>,
): Promise<string> {
  const imgRe = /<img\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>/gi;
  let result = html;
  const seen = new Map<string, string>();

  for (const match of html.matchAll(imgRe)) {
    const src = match[2]!;
    if (seen.has(src)) {
      result = result.replaceAll(src, seen.get(src)!);
      continue;
    }

    const filePath = isAbsolute(src) ? src : resolve(workDir, src);
    let data: Buffer;
    try {
      data = await readFile(filePath);
    } catch {
      continue;
    }

    const originalFilename = basename(filePath);
    const url = await uploadImage({
      mimeType: mimeFromFilename(originalFilename),
      originalFilename,
      data,
    });
    seen.set(src, url);
    result = result.replaceAll(src, url);
  }

  return result;
}
