import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import type { Editor } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import { CustomImage } from '../extensions/custom-image.js';
import { FontSize } from '../extensions/font-size.js';
import { DocsToolbar } from './DocsToolbar.js';

interface RichTextEditorProps {
  contentJson: string;
  onChange: (json: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  editable?: boolean;
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
}: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const suppressUpdate = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      CustomImage.configure({ inline: false, allowBase64: false }),
    ],
    content: JSON.parse(contentJson),
    editable,
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

  return (
    <div className="gdocs-editor">
      {editable ? <DocsToolbar editor={editor} onInsertImage={() => fileRef.current?.click()} /> : null}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImagePick} />
      <div className="gdocs-canvas-scroll">
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
    </div>
  );
}
