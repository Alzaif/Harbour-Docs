import { chromium, type Browser } from 'playwright-core';
import { tiptapToHtml, type ImageResolver } from './to-html.js';
import type { ParsedDoc } from './parse-doc.js';

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(executablePath: string): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browserPromise;
}

export async function tiptapToPdfBuffer(
  doc: ParsedDoc,
  resolveImage: ImageResolver,
  executablePath: string,
): Promise<Buffer> {
  const html = tiptapToHtml(doc, resolveImage, { includeDocumentTitle: false });
  const browser = await getBrowser(executablePath);
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closePdfBrowser(): Promise<void> {
  if (browserPromise) {
    await (await browserPromise).close();
    browserPromise = null;
  }
}
