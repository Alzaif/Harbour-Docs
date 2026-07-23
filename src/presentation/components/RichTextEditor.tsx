import { useEditor, EditorContent } from '@tiptap/react';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { createDocsTipTapExtensions } from '../../shared/tiptap-extensions.js';
import { CustomImage } from '../extensions/custom-image.js';
import { FontSize } from '../extensions/font-size.js';
import { LineHeight } from '../extensions/line-height.js';
import { DocsToolbar } from './DocsToolbar.js';
import { FindReplacePanel } from './FindReplacePanel.js';

export interface DocsEditorActions {
  insertImage: () => void;
  openFind: () => void;
}

interface RichTextEditorProps {
  contentJson: string;
  onChange: (json: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  editable?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
  actionsRef?: React.MutableRefObject<DocsEditorActions | null>;
}

const QUICK_STARTERS = [
  { label: 'Templates', icon: '▦' },
  { label: 'Meeting notes', icon: '📅' },
  { label: 'Email draft', icon: '✉' },
  { label: 'More', icon: '📄' },
] as const;

function isEmptyDoc(editor: Editor | null): boolean {
  if (!editor) return true;
  const json = editor.getJSON();
  const content = json.content;
  if (!content || content.length === 0) return true;
  if (content.length === 1 && content[0]?.type === 'paragraph') {
    const node = content[0];
    if (!node.content || node.content.length === 0) return true;
    if (
      node.content.length === 1 &&
      node.content[0]?.type === 'text' &&
      !(node.content[0] as { text?: string }).text?.trim()
    ) {
      return true;
    }
  }
  return false;
}

export function RichTextEditor({
  contentJson,
  onChange,
  onImageUpload,
  editable = true,
  onEditorReady,
  actionsRef,
}: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const suppressUpdate = useRef(true);
  const [findOpen, setFindOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      ...createDocsTipTapExtensions({
        image: CustomImage.configure({ inline: false, allowBase64: false }),
      }),
      FontSize,
      LineHeight,
      CharacterCount,
      Placeholder.configure({ placeholder: 'Type here, or pick a template to get started…' }),
    ],
    content: JSON.parse(contentJson),
    editable,
    editorProps: {
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
          event.preventDefault();
          setFindOpen(true);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdate.current) return;
      onChange(JSON.stringify(ed.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    suppressUpdate.current = true;
    const current = JSON.stringify(editor.getJSON());
    if (current !== contentJson) {
      editor.commands.setContent(JSON.parse(contentJson), { emitUpdate: false });
    }
    queueMicrotask(() => {
      suppressUpdate.current = false;
    });
  }, [contentJson, editor]);

  useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    return () => {
      onEditorReady?.(null);
    };
  }, [onEditorReady]);

  useEffect(() => {
    if (!actionsRef) return;
    actionsRef.current = {
      insertImage: () => fileRef.current?.click(),
      openFind: () => setFindOpen(true),
    };
    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).updateAttributes('image', { align: 'center' }).run();
    } finally {
      e.target.value = '';
    }
  };

  const insertStarter = (label: string) => {
    if (!editor) return;
    if (label === 'Meeting notes') {
      editor.commands.setContent({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting notes' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '• ' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action items' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '• ' }] },
        ],
      });
    } else if (label === 'Email draft') {
      editor.commands.setContent({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Hi,' }] },
          { type: 'paragraph' },
          { type: 'paragraph', content: [{ type: 'text', text: 'Best regards,' }] },
        ],
      });
    } else {
      editor.chain().focus().insertContent(`<p>${label} — start writing here.</p>`).run();
    }
    onChange(JSON.stringify(editor.getJSON()));
  };

  if (!editor) return null;

  const showQuickPills = editable && isEmptyDoc(editor);
  const words = editor.storage.characterCount?.words?.() ?? 0;
  const characters = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="gdocs-editor">
      {editable ? (
        <DocsToolbar
          editor={editor}
          onInsertImage={() => fileRef.current?.click()}
          onOpenFind={() => setFindOpen(true)}
        />
      ) : null}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImagePick} />
      <div className="gdocs-canvas-scroll">
        {findOpen && editable ? (
          <FindReplacePanel editor={editor} onClose={() => setFindOpen(false)} />
        ) : null}
        <div className="gdocs-canvas">
          <div className="gdocs-ruler" aria-hidden>
            {Array.from({ length: 17 }, (_, i) => (
              <span key={i} className="gdocs-ruler__tick">
                {i + 1}
              </span>
            ))}
          </div>
          <div className="gdocs-page">
            {showQuickPills ? (
              <div className="gdocs-quick-pills" role="group" aria-label="Quick insert">
                {QUICK_STARTERS.map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    className="gdocs-quick-pill"
                    onClick={() => insertStarter(pill.label)}
                  >
                    <span className="gdocs-quick-pill__icon" aria-hidden>
                      {pill.icon}
                    </span>
                    {pill.label}
                  </button>
                ))}
              </div>
            ) : null}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      {editable ? (
        <div className="gdocs-statusbar" aria-live="polite">
          <span>{words} {words === 1 ? 'word' : 'words'}</span>
          <span className="gdocs-statusbar__sep">·</span>
          <span>{characters} characters</span>
        </div>
      ) : null}
    </div>
  );
}
