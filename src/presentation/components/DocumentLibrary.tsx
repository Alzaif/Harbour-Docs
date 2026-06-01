import type { DocumentSummary } from '../api/types.js';

export interface DocumentLibraryProps {
  readonly documents: readonly DocumentSummary[];
  readonly selectedId: string | null;
  readonly searchQuery: string;
  readonly loading?: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onSelect: (id: string) => void;
  readonly onCreate: () => void;
  readonly onDelete: (id: string) => void;
}

export function DocumentLibrary({
  documents,
  selectedId,
  searchQuery,
  loading = false,
  onSearchChange,
  onSelect,
  onCreate,
  onDelete,
}: DocumentLibraryProps) {
  return (
    <aside className="doc-tabs" aria-label="Document tabs">
      <div className="doc-tabs__header">
        <h2 className="doc-tabs__title">Document tabs</h2>
        <button
          type="button"
          className="doc-tabs__add"
          onClick={onCreate}
          aria-label="New document"
          title="New document"
        >
          +
        </button>
      </div>
      <input
        type="search"
        className="doc-tabs__search"
        placeholder="Search…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search documents"
      />
      {loading ? (
        <p className="doc-tabs__status">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="doc-tabs__status">No documents yet. Click + to create one.</p>
      ) : (
        <ul className="doc-tabs__list">
          {documents.map((doc, index) => (
            <li key={doc.id} className="doc-tabs__row">
              <button
                type="button"
                className={`doc-tabs__tab${doc.id === selectedId ? ' doc-tabs__tab--active' : ''}`}
                onClick={() => onSelect(doc.id)}
                aria-current={doc.id === selectedId ? 'true' : undefined}
              >
                <span className="doc-tabs__tab-label">{doc.title || `Tab ${index + 1}`}</span>
              </button>
              <button
                type="button"
                className="doc-tabs__menu"
                title={`Options for ${doc.title}`}
                aria-label={`Delete ${doc.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc.id);
                }}
              >
                ⋮
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="doc-tabs__outline-hint">
        Headings you add to the document will appear here.
      </p>
    </aside>
  );
}
