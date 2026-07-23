import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OdfNativeOdtConverter } from '../../../src/infrastructure/conversion/odf-native-odt-converter.js';
import { htmlToTipTapJson } from '../../../src/shared/tiptap-import/html-to-tiptap.js';

function createRichOdt(): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'odt-rich-'));
  mkdirSync(join(dir, 'META-INF'), { recursive: true });
  mkdirSync(join(dir, 'Pictures'), { recursive: true });

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:draw:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.2">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">Rich document title</text:h>
      <text:p>Intro paragraph with plain text for import testing.</text:p>
      <text:p>Second paragraph before an embedded image.</text:p>
      <draw:frame draw:name="Image1">
        <draw:image xlink:href="Pictures/test-image.png" xlink:type="simple" />
      </draw:frame>
      <text:p>Paragraph after the draw:frame image reference.</text:p>
    </office:text>
  </office:body>
</office:document-content>`;

  writeFileSync(join(dir, 'mimetype'), 'application/vnd.oasis.opendocument.text');
  writeFileSync(join(dir, 'content.xml'), contentXml);
  writeFileSync(
    join(dir, 'META-INF', 'manifest.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`,
  );
  writeFileSync(join(dir, 'Pictures', 'test-image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));

  const odtPath = join(dir, 'sample.odt');
  execSync(
    `cd "${dir}" && zip -X -0 "${odtPath}" mimetype && zip -X "${odtPath}" content.xml META-INF/manifest.xml Pictures/test-image.png`,
  );
  return readFileSync(odtPath);
}

describe('OdfNativeOdtConverter', () => {
  it('imports text and image references from content.xml', async () => {
    const buffer = createRichOdt();
    const workDir = mkdtempSync(join(tmpdir(), 'odt-native-'));
    const converter = new OdfNativeOdtConverter();
    const { html } = await converter.convertOdtToHtml(buffer, workDir);

    expect(html).toContain('Rich document title');
    expect(html).toContain('Intro paragraph with plain text');
    expect(html).toContain('Pictures/test-image.png');

    const json = JSON.parse(htmlToTipTapJson(html)) as {
      content: Array<{ type: string }>;
    };
    expect(json.content.some((n) => n.type === 'heading')).toBe(true);
    expect(json.content.some((n) => n.type === 'paragraph')).toBe(true);
    expect(json.content.some((n) => n.type === 'image')).toBe(true);
  });
});
