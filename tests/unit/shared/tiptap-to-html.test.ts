import { describe, expect, it } from 'vitest';
import { parseTipTapDocument } from '../../../src/shared/tiptap-export/parse-doc.js';
import { tiptapToHtml } from '../../../src/shared/tiptap-export/to-html.js';
import { EMPTY_DOC_JSON } from '../../../src/shared/extract-plain-text.js';

describe('tiptapToHtml', () => {
  it('renders title and paragraph', () => {
    const parsed = parseTipTapDocument(EMPTY_DOC_JSON, 'Hello');
    const html = tiptapToHtml(parsed, () => null);
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<p');
  });

  it('embeds resolved images as data URLs', () => {
    const contentJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: '/api/attachments/abc/content', align: 'center', width: 200 },
        },
      ],
    });
    const parsed = parseTipTapDocument(contentJson, 'Img');
    const html = tiptapToHtml(parsed, (id) =>
      id === 'abc'
        ? { dataUrl: 'data:image/png;base64,AAAA', mimeType: 'image/png' }
        : null,
    );
    expect(html).toContain('data:image/png;base64,AAAA');
  });
});
