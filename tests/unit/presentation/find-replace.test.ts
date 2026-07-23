import { describe, expect, it } from 'vitest';
import type { Editor } from '@tiptap/react';
import { collectMatches } from '../../../src/presentation/components/find-matches.js';

/**
 * collectMatches only depends on editor.state.doc.descendants, so we exercise it
 * with a minimal fake document rather than a full ProseMirror instance.
 */
function fakeEditor(textNodes: { text: string; pos: number }[]): Editor {
  return {
    state: {
      doc: {
        descendants(cb: (node: { isText: boolean; text: string }, pos: number) => void) {
          for (const n of textNodes) cb({ isText: true, text: n.text }, n.pos);
        },
      },
    },
  } as unknown as Editor;
}

describe('collectMatches', () => {
  it('returns empty for empty query', () => {
    expect(collectMatches(fakeEditor([{ text: 'hello', pos: 0 }]), '', false)).toEqual([]);
  });

  it('finds case-insensitive matches with correct absolute positions', () => {
    const editor = fakeEditor([{ text: 'foo Foo foo', pos: 1 }]);
    const matches = collectMatches(editor, 'foo', false);
    expect(matches).toHaveLength(3);
    expect(matches[0]).toEqual({ from: 1, to: 4 });
    expect(matches[1]).toEqual({ from: 5, to: 8 });
    expect(matches[2]).toEqual({ from: 9, to: 12 });
  });

  it('respects case sensitivity', () => {
    const editor = fakeEditor([{ text: 'foo Foo foo', pos: 1 }]);
    expect(collectMatches(editor, 'foo', true)).toHaveLength(2);
  });

  it('treats the query as a literal string, not a regex', () => {
    const editor = fakeEditor([{ text: 'a.b a.b axb', pos: 0 }]);
    expect(collectMatches(editor, 'a.b', false)).toHaveLength(2);
  });

  it('spans match positions across multiple text nodes', () => {
    const editor = fakeEditor([
      { text: 'one cat', pos: 0 },
      { text: 'cat two', pos: 20 },
    ]);
    const matches = collectMatches(editor, 'cat', false);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ from: 4, to: 7 });
    expect(matches[1]).toEqual({ from: 20, to: 23 });
  });
});
