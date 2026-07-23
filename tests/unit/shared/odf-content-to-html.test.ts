import { describe, expect, it } from 'vitest';
import {
  odfContentXmlToHtml,
  odfHtmlHasSubstantiveText,
  wrapOdfHtmlBody,
} from '../../../src/shared/odf/odf-content-to-html.js';
import { htmlToTipTapJson } from '../../../src/shared/tiptap-import/html-to-tiptap.js';

const NS = {
  office: 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
  text: 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
  draw: 'urn:oasis:names:tc:opendocument:xmlns:draw:1.0',
  xlink: 'http://www.w3.org/1999/xlink',
  table: 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
};

function wrapContent(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="${NS.office}" xmlns:text="${NS.text}" xmlns:draw="${NS.draw}" xmlns:xlink="${NS.xlink}" xmlns:table="${NS.table}" office:version="1.2">
  <office:body>
    <office:text>
      ${inner}
    </office:text>
  </office:body>
</office:document-content>`;
}

describe('odfContentXmlToHtml', () => {
  it('converts text:h and text:p from content.xml', () => {
    const html = odfContentXmlToHtml(
      wrapContent(`
      <text:h text:outline-level="1">Document title</text:h>
      <text:p>First paragraph with <text:span>emphasis</text:span>.</text:p>
      <text:p>Second paragraph.</text:p>
    `),
    );
    expect(html).toContain('<h1>Document title</h1>');
    expect(html).toContain('First paragraph with <span>emphasis</span>.');
    expect(html).toContain('<p>Second paragraph.</p>');
  });

  it('converts draw:frame images using xlink:href', () => {
    const html = odfContentXmlToHtml(
      wrapContent(`
      <text:p>Before image</text:p>
      <draw:frame draw:name="Image1">
        <draw:image xlink:href="Pictures/photo.png" xlink:type="simple" />
      </draw:frame>
      <text:p>After image</text:p>
    `),
    );
    expect(html).toContain('<img src="Pictures/photo.png"');
    expect(html).toContain('Before image');
    expect(html).toContain('After image');
  });

  it('converts text lists and tables', () => {
    const html = odfContentXmlToHtml(
      wrapContent(`
      <text:list>
        <text:list-item><text:p>One</text:p></text:list-item>
        <text:list-item><text:p>Two</text:p></text:list-item>
      </text:list>
      <table:table>
        <table:table-row>
          <table:table-cell><text:p>A1</text:p></table:table-cell>
          <table:table-cell><text:p>B1</text:p></table:table-cell>
        </table:table-row>
      </table:table>
    `),
    );
    expect(html).toContain('<ul>');
    expect(html).toContain('<li><p>One</p></li>');
    expect(html).toContain('<table>');
    expect(html).toContain('<td><p>A1</p></td>');
  });

  it('round-trips to TipTap JSON with text and image nodes', () => {
    const html = wrapOdfHtmlBody(
      odfContentXmlToHtml(
        wrapContent(`
        <text:h text:outline-level="2">Section</text:h>
        <text:p>Body copy.</text:p>
        <draw:frame><draw:image xlink:href="Pictures/chart.png" xlink:type="simple" /></draw:frame>
      `),
      ),
    );
    const json = JSON.parse(htmlToTipTapJson(html)) as {
      content: Array<{ type: string; content?: Array<{ text?: string }> }>;
    };
    expect(json.content.some((n) => n.type === 'heading')).toBe(true);
    expect(json.content.some((n) => n.type === 'paragraph')).toBe(true);
    expect(json.content.some((n) => n.type === 'image')).toBe(true);
    expect(odfHtmlHasSubstantiveText(html)).toBe(true);
  });
});
