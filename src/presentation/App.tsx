import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api/client.js';
import type { Document, DocumentSummary } from './api/types.js';
import { HarbourAppBar } from './components/HarbourAppBar.js';
import { DocumentLibrary } from './components/DocumentLibrary.js';
import { DocsTitleBar } from './components/DocsTitleBar.js';
import { RichTextEditor } from './components/RichTextEditor.js';
import { contentJsonEquals } from '../shared/normalize-content-json.js';

const shellUrl = import.meta.env.VITE_HARBOUR_SHELL_URL?.trim() || window.location.origin;

export function App() {
  const [documents, setDocuments] = useState<readonly DocumentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');

  const titleRef = useRef('');
  const contentRef = useRef('');
  const versionRef = useRef(1);
  const savedBaseline = useRef({ title: '', contentJson: '' });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshList = useCallback(async (q?: string) => {
    setListLoading(true);
    try {
      const list = await api.listDocuments(q);
      setDocuments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const t = setTimeout(() => void refreshList(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, refreshList]);

  const loadDocument = useCallback(async (id: string) => {
    setDocLoading(true);
    setError(null);
    try {
      const doc = await api.getDocument(id);
      setDocument(doc);
      setSelectedId(id);
      titleRef.current = doc.title;
      contentRef.current = doc.contentJson;
      versionRef.current = doc.version;
      savedBaseline.current = { title: doc.title, contentJson: doc.contentJson };
      setSaveState('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load document');
    } finally {
      setDocLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDocument(selectedId);
  }, [selectedId, loadDocument]);

  const flushSave = useCallback(async () => {
    if (!selectedId || !document) return;
    const title = titleRef.current;
    const contentJson = contentRef.current;
    if (
      title === savedBaseline.current.title &&
      contentJsonEquals(contentJson, savedBaseline.current.contentJson)
    ) {
      setSaveState('saved');
      return;
    }
    setSaveState('saving');
    try {
      const updated = await api.updateDocument(selectedId, {
        version: versionRef.current,
        title,
        contentJson,
      });
      setDocument(updated);
      versionRef.current = updated.version;
      savedBaseline.current = { title: updated.title, contentJson: updated.contentJson };
      setSaveState('saved');
      void refreshList(searchQuery);
    } catch (e) {
      setSaveState('error');
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  }, [selectedId, document, searchQuery, refreshList]);

  const scheduleSave = useCallback(() => {
    setSaveState('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 800);
  }, [flushSave]);

  const handleSelect = async (id: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await flushSave();
    setSelectedId(id);
  };

  const handleCreate = async () => {
    try {
      const doc = await api.createDocument();
      await refreshList(searchQuery);
      setSelectedId(doc.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(id);
      if (selectedId === id) {
        setSelectedId(null);
        setDocument(null);
      }
      await refreshList(searchQuery);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete document');
    }
  };

  return (
    <div className="docs-app">
      <HarbourAppBar homeUrl={shellUrl} appName="Docs" />
      <div className="docs-shell">
        {document ? (
          <DocsTitleBar
            title={document.title}
            saveState={saveState}
            onTitleChange={(t) => {
              titleRef.current = t;
              setDocument({ ...document, title: t });
              scheduleSave();
            }}
            onExportDocx={() => api.exportDocx(document.id)}
            onExportPdf={() => api.exportPdf(document.id)}
          />
        ) : (
          <header className="docs-titlebar docs-titlebar--empty">
            <span className="docs-titlebar__empty-hint">Select or create a document to start writing</span>
          </header>
        )}

        {error ? (
          <div className="docs-app__error" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="docs-app__body">
          <DocumentLibrary
            documents={documents}
            selectedId={selectedId}
            searchQuery={searchQuery}
            loading={listLoading}
            onSearchChange={setSearchQuery}
            onSelect={(id) => void handleSelect(id)}
            onCreate={() => void handleCreate()}
            onDelete={(id) => void handleDelete(id)}
          />
          <main className="docs-app__workspace">
            {docLoading ? (
              <p className="docs-app__loading">Loading document…</p>
            ) : document ? (
              <RichTextEditor
                contentJson={document.contentJson}
                onChange={(json) => {
                  contentRef.current = json;
                  setDocument({ ...document, contentJson: json });
                  scheduleSave();
                }}
                onImageUpload={(file) => api.uploadImage(document.id, file)}
              />
            ) : (
              <div className="docs-app__welcome">
                <p>Create a document with the <strong>+</strong> button in Document tabs.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
