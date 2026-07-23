import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import JSZip from 'jszip';
import type { DocumentConverterPort, OdtConversionResult } from '../../domain/ports/document-converter.port.js';
import {
  odfContentXmlToHtml,
  odfHtmlHasSubstantiveText,
  wrapOdfHtmlBody,
} from '../../shared/odf/odf-content-to-html.js';

const PACKAGE_MEDIA_PREFIXES = ['Pictures/', 'media/', 'ObjectReplacements/'];

function isPackageMediaPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  if (PACKAGE_MEDIA_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(normalized);
}

export async function extractOdtPackageAssets(
  buffer: Buffer,
  workDir: string,
): Promise<{ contentXml: string; title: string | null }> {
  const zip = await JSZip.loadAsync(buffer);
  const contentFile = zip.file('content.xml');
  if (!contentFile) {
    throw new Error('Missing content.xml');
  }
  const contentXml = await contentFile.async('string');

  let title: string | null = null;
  const metaFile = zip.file('meta.xml');
  if (metaFile) {
    const metaXml = await metaFile.async('string');
    const match = metaXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i);
    if (match?.[1]?.trim()) title = match[1].trim();
  }

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !isPackageMediaPath(path)) continue;
    const dest = join(workDir, path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, await entry.async('nodebuffer'));
  }

  return { contentXml, title };
}

export class OdfNativeOdtConverter implements DocumentConverterPort {
  async convertOdtToHtml(buffer: Buffer, workDir: string): Promise<OdtConversionResult> {
    await mkdir(workDir, { recursive: true });
    const { contentXml, title } = await extractOdtPackageAssets(buffer, workDir);
    const bodyHtml = odfContentXmlToHtml(contentXml);
    if (!odfHtmlHasSubstantiveText(bodyHtml) && !bodyHtml.includes('<img')) {
      throw new Error('No importable content found in ODT');
    }
    const html = wrapOdfHtmlBody(bodyHtml, title ?? 'Imported document');
    return { html, mediaDir: workDir };
  }
}

export class CompositeOdtConverter implements DocumentConverterPort {
  constructor(
    private readonly nativeConverter: DocumentConverterPort,
    private readonly pandocConverter: DocumentConverterPort,
  ) {}

  async convertOdtToHtml(buffer: Buffer, workDir: string): Promise<OdtConversionResult> {
    try {
      const native = await this.nativeConverter.convertOdtToHtml(buffer, workDir);
      if (odfHtmlHasSubstantiveText(native.html) || native.html.includes('<img')) {
        return native;
      }
    } catch {
      /* fall back to pandoc */
    }
    return this.pandocConverter.convertOdtToHtml(buffer, workDir);
  }
}
