import { useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { collectMatches } from './find-matches.js';

interface FindReplacePanelProps {
  readonly editor: Editor;
  readonly onClose: () => void;
}

export function FindReplacePanel({ editor, onClose }: FindReplacePanelProps) {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(
    () => collectMatches(editor, query, caseSensitive),
    [editor, query, caseSensitive],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, caseSensitive]);

  const focusMatch = (index: number) => {
    const match = matches[index];
    if (!match) return;
    editor.chain().setTextSelection({ from: match.from, to: match.to }).scrollIntoView().run();
  };

  const findNext = () => {
    if (matches.length === 0) return;
    const next = (activeIndex + 1) % matches.length;
    setActiveIndex(next);
    focusMatch(next);
  };

  const findPrev = () => {
    if (matches.length === 0) return;
    const prev = (activeIndex - 1 + matches.length) % matches.length;
    setActiveIndex(prev);
    focusMatch(prev);
  };

  const replaceCurrent = () => {
    const match = matches[activeIndex];
    if (!match) return;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: match.from, to: match.to }, replacement)
      .run();
  };

  const replaceAll = () => {
    if (matches.length === 0) return;
    const ordered = [...matches].sort((a, b) => b.from - a.from);
    const chain = editor.chain().focus();
    for (const match of ordered) {
      chain.insertContentAt({ from: match.from, to: match.to }, replacement);
    }
    chain.run();
  };

  return (
    <div className="gdocs-find" role="dialog" aria-label="Find and replace">
      <div className="gdocs-find__row">
        <input
          className="gdocs-find__input"
          type="text"
          placeholder="Find in document"
          aria-label="Find"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) findPrev();
              else findNext();
            }
            if (e.key === 'Escape') onClose();
          }}
        />
        <span className="gdocs-find__count">
          {matches.length ? `${Math.min(activeIndex + 1, matches.length)}/${matches.length}` : '0/0'}
        </span>
        <button type="button" className="gdocs-find__nav" title="Previous" onClick={findPrev}>
          ↑
        </button>
        <button type="button" className="gdocs-find__nav" title="Next" onClick={findNext}>
          ↓
        </button>
        <button type="button" className="gdocs-find__close" title="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="gdocs-find__row">
        <input
          className="gdocs-find__input"
          type="text"
          placeholder="Replace with"
          aria-label="Replace with"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
        />
        <button type="button" className="gdocs-find__action" onClick={replaceCurrent}>
          Replace
        </button>
        <button type="button" className="gdocs-find__action" onClick={replaceAll}>
          All
        </button>
      </div>
      <label className="gdocs-find__opt">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        Match case
      </label>
    </div>
  );
}
