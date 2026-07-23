import type { Editor } from '@tiptap/react';

export interface Match {
  from: number;
  to: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Collect literal (non-regex) matches of `query` across the document's text
 * nodes, returning absolute ProseMirror positions. Lives in a JSX-free module so
 * the logic can be unit tested without pulling in React.
 */
export function collectMatches(editor: Editor, query: string, caseSensitive: boolean): Match[] {
  const matches: Match[] = [];
  if (!query) return matches;
  const flags = caseSensitive ? 'g' : 'gi';
  const re = new RegExp(escapeRegExp(query), flags);
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(node.text)) !== null) {
      const from = pos + m.index;
      matches.push({ from, to: from + m[0].length });
      if (m[0].length === 0) re.lastIndex += 1;
    }
  });
  return matches;
}
