import { describe, expect, it } from 'vitest';
import { htmlToTipTapJson } from '../../../src/shared/tiptap-import/html-to-tiptap.js';

describe('htmlToTipTapJson', () => {
  it('converts headings and paragraphs to TipTap JSON', () => {
    const html = `<!DOCTYPE html><html><body>
      <h1>Title</h1>
      <p>Hello <strong>world</strong>.</p>
    </body></html>`;
    const json = JSON.parse(htmlToTipTapJson(html)) as {
      type: string;
      content: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
    };
    expect(json.type).toBe('doc');
    expect(json.content.some((n) => n.type === 'heading')).toBe(true);
    expect(json.content.some((n) => n.type === 'paragraph')).toBe(true);
  });

  it('converts bullet lists', () => {
    const html = '<ul><li>One</li><li>Two</li></ul>';
    const json = JSON.parse(htmlToTipTapJson(html)) as { content: Array<{ type: string }> };
    expect(json.content.some((n) => n.type === 'bulletList')).toBe(true);
  });
});
