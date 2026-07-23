import { describe, expect, it } from 'vitest';
import { parseTipTapDocument } from '../../../src/shared/tiptap-export/parse-doc.js';
import { tiptapToDocxBuffer } from '../../../src/shared/tiptap-export/to-docx.js';

const noImages = () => null;

describe('tiptapToDocxBuffer', () => {
  it('produces a non-empty .docx buffer for a simple document', async () => {
    const parsed = parseTipTapDocument(
      JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
      }),
      'Greeting',
    );
    const buffer = await tiptapToDocxBuffer(parsed, noImages);
    expect(buffer.length).toBeGreaterThan(0);
    // DOCX is a ZIP archive — verify the PK magic bytes.
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('handles new marks, task lists, tables, and rules without throwing', async () => {
    const parsed = parseTipTapDocument(
      JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Section' }] },
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'strike' }], text: 'old' },
              { type: 'text', marks: [{ type: 'superscript' }], text: '2' },
              {
                type: 'text',
                marks: [
                  { type: 'highlight', attrs: { color: '#ffff00' } },
                  { type: 'textStyle', attrs: { color: '#ff0000', fontSize: '14pt' } },
                ],
                text: 'note',
              },
            ],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ship it' }] }],
              },
            ],
          },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
                  },
                  {
                    type: 'tableCell',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }],
                  },
                ],
              },
            ],
          },
          { type: 'horizontalRule' },
          { type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1;' }] },
        ],
      }),
      'Kitchen sink',
    );
    const buffer = await tiptapToDocxBuffer(parsed, noImages);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
