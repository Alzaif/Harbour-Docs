import { useState } from 'react';
import { IconDoc, IconStar } from './DocsIcons.js';

const MENU_ITEMS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help'] as const;

export interface DocsTitleBarProps {
  readonly title: string;
  readonly saveState: 'saved' | 'saving' | 'dirty' | 'error';
  readonly onTitleChange: (title: string) => void;
  readonly onExportDocx: () => void;
  readonly onExportPdf: () => void;
}

function saveLabel(state: DocsTitleBarProps['saveState']): string {
  switch (state) {
    case 'saving':
      return 'Saving…';
    case 'dirty':
      return 'Unsaved changes';
    case 'error':
      return 'Save failed';
    default:
      return 'Saved to Harbour';
  }
}

export function DocsTitleBar({
  title,
  saveState,
  onTitleChange,
  onExportDocx,
  onExportPdf,
}: DocsTitleBarProps) {
  const [starred, setStarred] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <header className="docs-titlebar">
      <div className="docs-titlebar__row docs-titlebar__row--primary">
        <div className="docs-titlebar__left">
          <span className="docs-titlebar__doc-icon">
            <IconDoc />
          </span>
          <input
            className="docs-titlebar__title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled document"
            aria-label="Document title"
          />
          <button
            type="button"
            className={`docs-titlebar__star${starred ? ' docs-titlebar__star--on' : ''}`}
            title={starred ? 'Remove from starred' : 'Star'}
            aria-label={starred ? 'Unstar document' : 'Star document'}
            aria-pressed={starred}
            onClick={() => setStarred((s) => !s)}
          >
            <IconStar filled={starred} />
          </button>
          <span className={`docs-titlebar__save docs-titlebar__save--${saveState}`}>
            {saveLabel(saveState)}
          </span>
        </div>
        <div className="docs-titlebar__actions">
          <div className="docs-titlebar__export-wrap">
            <button
              type="button"
              className="docs-titlebar__share"
              onClick={() => setExportOpen((o) => !o)}
              aria-expanded={exportOpen}
              aria-haspopup="menu"
            >
              Export
            </button>
            {exportOpen ? (
              <div className="docs-titlebar__export-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { onExportDocx(); setExportOpen(false); }}>
                  Download DOCX
                </button>
                <button type="button" role="menuitem" onClick={() => { onExportPdf(); setExportOpen(false); }}>
                  Download PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <nav className="docs-menubar" aria-label="Document menu">
        {MENU_ITEMS.map((item) => (
          <button key={item} type="button" className="docs-menubar__item">
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}
