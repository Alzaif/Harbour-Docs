import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { isEditorUsable } from '../editor-usable.js';

type MenuItem =
  | {
      kind: 'action';
      label: string;
      shortcut?: string;
      disabled?: boolean;
      active?: boolean;
      run: () => void;
    }
  | { kind: 'separator' };

interface MenuDef {
  label: string;
  items: MenuItem[];
}

export interface DocsMenuBarProps {
  readonly editor: Editor | null;
  readonly onNewDocument: () => void;
  readonly onOpenOdt: () => void;
  readonly onInsertImage: () => void;
  readonly onOpenFind: () => void;
  readonly onExportDocx: () => void;
  readonly onExportPdf: () => void;
}

function buildMenus(props: DocsMenuBarProps): MenuDef[] {
  const { editor } = props;
  const editorUsable = isEditorUsable(editor);
  const can = (fn: () => boolean) => editorUsable && fn();
  const linkPrompt = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return [
    {
      label: 'File',
      items: [
        { kind: 'action', label: 'New document', run: props.onNewDocument },
        { kind: 'action', label: 'Open ODT…', run: props.onOpenOdt },
        { kind: 'action', label: 'Print', shortcut: 'Ctrl+P', run: () => window.print() },
        { kind: 'separator' },
        { kind: 'action', label: 'Download as DOCX', run: props.onExportDocx },
        { kind: 'action', label: 'Download as PDF', run: props.onExportPdf },
      ],
    },
    {
      label: 'Edit',
      items: [
        {
          kind: 'action',
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          disabled: !can(() => editor!.can().undo()),
          run: () => editor?.chain().focus().undo().run(),
        },
        {
          kind: 'action',
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          disabled: !can(() => editor!.can().redo()),
          run: () => editor?.chain().focus().redo().run(),
        },
        { kind: 'separator' },
        {
          kind: 'action',
          label: 'Select all',
          shortcut: 'Ctrl+A',
          run: () => editor?.chain().focus().selectAll().run(),
        },
        { kind: 'action', label: 'Find and replace', shortcut: 'Ctrl+F', run: props.onOpenFind },
      ],
    },
    {
      label: 'View',
      items: [
        {
          kind: 'action',
          label: 'Full screen',
          run: () => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          },
        },
        {
          kind: 'action',
          label: 'Print layout',
          run: () => window.print(),
        },
      ],
    },
    {
      label: 'Insert',
      items: [
        { kind: 'action', label: 'Image', run: props.onInsertImage },
        {
          kind: 'action',
          label: 'Table',
          run: () =>
            editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        },
        {
          kind: 'action',
          label: 'Horizontal line',
          run: () => editor?.chain().focus().setHorizontalRule().run(),
        },
        { kind: 'action', label: 'Link', shortcut: 'Ctrl+K', run: linkPrompt },
        { kind: 'separator' },
        {
          kind: 'action',
          label: 'Checklist',
          active: editor?.isActive('taskList'),
          run: () => editor?.chain().focus().toggleTaskList().run(),
        },
      ],
    },
    {
      label: 'Format',
      items: [
        {
          kind: 'action',
          label: 'Bold',
          shortcut: 'Ctrl+B',
          active: editor?.isActive('bold'),
          run: () => editor?.chain().focus().toggleBold().run(),
        },
        {
          kind: 'action',
          label: 'Italic',
          shortcut: 'Ctrl+I',
          active: editor?.isActive('italic'),
          run: () => editor?.chain().focus().toggleItalic().run(),
        },
        {
          kind: 'action',
          label: 'Underline',
          shortcut: 'Ctrl+U',
          active: editor?.isActive('underline'),
          run: () => editor?.chain().focus().toggleUnderline().run(),
        },
        {
          kind: 'action',
          label: 'Strikethrough',
          active: editor?.isActive('strike'),
          run: () => editor?.chain().focus().toggleStrike().run(),
        },
        { kind: 'separator' },
        {
          kind: 'action',
          label: 'Align left',
          active: editor?.isActive({ textAlign: 'left' }),
          run: () => editor?.chain().focus().setTextAlign('left').run(),
        },
        {
          kind: 'action',
          label: 'Align center',
          active: editor?.isActive({ textAlign: 'center' }),
          run: () => editor?.chain().focus().setTextAlign('center').run(),
        },
        {
          kind: 'action',
          label: 'Align right',
          active: editor?.isActive({ textAlign: 'right' }),
          run: () => editor?.chain().focus().setTextAlign('right').run(),
        },
        {
          kind: 'action',
          label: 'Justify',
          active: editor?.isActive({ textAlign: 'justify' }),
          run: () => editor?.chain().focus().setTextAlign('justify').run(),
        },
        { kind: 'separator' },
        {
          kind: 'action',
          label: 'Bulleted list',
          active: editor?.isActive('bulletList'),
          run: () => editor?.chain().focus().toggleBulletList().run(),
        },
        {
          kind: 'action',
          label: 'Numbered list',
          active: editor?.isActive('orderedList'),
          run: () => editor?.chain().focus().toggleOrderedList().run(),
        },
        { kind: 'separator' },
        {
          kind: 'action',
          label: 'Clear formatting',
          run: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
        },
      ],
    },
    {
      label: 'Tools',
      items: [
        {
          kind: 'action',
          label: 'Word count',
          run: () => {
            const words = editor?.storage.characterCount?.words?.() ?? 0;
            const characters = editor?.storage.characterCount?.characters?.() ?? 0;
            window.alert(`Words: ${words}\nCharacters: ${characters}`);
          },
        },
        { kind: 'action', label: 'Find and replace', shortcut: 'Ctrl+F', run: props.onOpenFind },
      ],
    },
    {
      label: 'Help',
      items: [
        {
          kind: 'action',
          label: 'Keyboard shortcuts',
          run: () =>
            window.alert(
              [
                'Bold: Ctrl+B',
                'Italic: Ctrl+I',
                'Underline: Ctrl+U',
                'Link: Ctrl+K',
                'Find & replace: Ctrl+F',
                'Undo / Redo: Ctrl+Z / Ctrl+Y',
                'Print: Ctrl+P',
              ].join('\n'),
            ),
        },
        {
          kind: 'action',
          label: 'About Harbour Docs',
          run: () => window.alert('Harbour Docs — a lite word processor for the Harbour platform.'),
        },
      ],
    },
  ];
}

export function DocsMenuBar(props: DocsMenuBarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const menus = buildMenus(props);

  useEffect(() => {
    if (openIndex === null) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenIndex(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openIndex]);

  return (
    <nav className="docs-menubar" aria-label="Document menu" ref={barRef}>
      {menus.map((menu, index) => (
        <div className="docs-menubar__menu" key={menu.label}>
          <button
            type="button"
            className={`docs-menubar__item${openIndex === index ? ' docs-menubar__item--open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={openIndex === index}
            onClick={() => setOpenIndex((cur) => (cur === index ? null : index))}
            onMouseEnter={() => setOpenIndex((cur) => (cur === null ? cur : index))}
          >
            {menu.label}
          </button>
          {openIndex === index ? (
            <div className="docs-menubar__dropdown" role="menu">
              {menu.items.map((item, i) =>
                item.kind === 'separator' ? (
                  <div className="docs-menubar__divider" key={`sep-${i}`} role="separator" />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className="docs-menubar__option"
                    disabled={item.disabled}
                    onClick={() => {
                      item.run();
                      setOpenIndex(null);
                    }}
                  >
                    <span className="docs-menubar__check" aria-hidden>
                      {item.active ? '✓' : ''}
                    </span>
                    <span className="docs-menubar__label">{item.label}</span>
                    {item.shortcut ? (
                      <span className="docs-menubar__shortcut">{item.shortcut}</span>
                    ) : null}
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
