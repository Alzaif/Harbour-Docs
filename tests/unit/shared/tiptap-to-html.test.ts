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

  it('omits document title from body when includeDocumentTitle is false', () => {
    const parsed = parseTipTapDocument(EMPTY_DOC_JSON, 'Hello');
    const html = tiptapToHtml(parsed, () => null, { includeDocumentTitle: false });
    expect(html).toContain('<title>Hello</title>');
    expect(html).not.toMatch(/<body>\s*<h1>Hello<\/h1>/);
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

  it('renders the full set of inline marks', () => {
    const contentJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'strike' }], text: 'gone' },
            { type: 'text', marks: [{ type: 'subscript' }], text: 'lo' },
            { type: 'text', marks: [{ type: 'superscript' }], text: 'hi' },
            {
              type: 'text',
              marks: [{ type: 'highlight', attrs: { color: '#ffff00' } }],
              text: 'mark',
            },
            {
              type: 'text',
              marks: [{ type: 'textStyle', attrs: { color: '#ff0000', fontSize: '18pt' } }],
              text: 'styled',
            },
          ],
        },
      ],
    });
    const html = tiptapToHtml(parseTipTapDocument(contentJson, 'Marks'), () => null);
    expect(html).toContain('<s>gone</s>');
    expect(html).toContain('<sub>lo</sub>');
    expect(html).toContain('<sup>hi</sup>');
    expect(html).toContain('background-color:#ffff00');
    expect(html).toContain('color:#ff0000');
    expect(html).toContain('font-size:18pt');
  });

  it('renders task lists with checkbox state', () => {
    const contentJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'done' }] }],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'todo' }] }],
            },
          ],
        },
      ],
    });
    const html = tiptapToHtml(parseTipTapDocument(contentJson, 'Tasks'), () => null);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
    expect(html).toContain('done');
    expect(html).toContain('todo');
  });

  it('renders tables and horizontal rules', () => {
    const contentJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C' }] }] },
              ],
            },
          ],
        },
        { type: 'horizontalRule' },
      ],
    });
    const html = tiptapToHtml(parseTipTapDocument(contentJson, 'Table'), () => null);
    expect(html).toContain('<table');
    expect(html).toContain('<th');
    expect(html).toContain('<td');
    expect(html).toContain('<hr />');
  });

  it('floats wrapped images so text flows around them', () => {
    const contentJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: { src: '/api/attachments/x/content', wrap: 'left', width: 150 },
        },
      ],
    });
    const html = tiptapToHtml(parseTipTapDocument(contentJson, 'Wrap'), () => ({
      dataUrl: 'data:image/png;base64,AAAA',
      mimeType: 'image/png',
    }));
    expect(html).toContain('float:left');
    expect(html).toContain('width:150px');
  });

  it('applies line-height to paragraphs', () => {
    const contentJson = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { lineHeight: '1.5' }, content: [{ type: 'text', text: 'spaced' }] },
      ],
    });
    const html = tiptapToHtml(parseTipTapDocument(contentJson, 'LH'), () => null);
    expect(html).toContain('line-height:1.5');
  });
});
