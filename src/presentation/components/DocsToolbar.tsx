import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBulletList,
  IconImage,
  IconIndentDecrease,
  IconIndentIncrease,
  IconLink,
  IconNumberedList,
  IconPrint,
  IconRedo,
  IconUndo,
} from './DocsIcons.js';

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
] as const;

const STYLE_OPTIONS = [
  { label: 'Normal text', value: 'paragraph' },
  { label: 'Title', value: 'title' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
] as const;

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72] as const;

interface DocsToolbarProps {
  readonly editor: Editor;
  readonly onInsertImage: () => void;
}

function ToolbarButton({
  active,
  disabled,
  title,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`gdocs-tb__btn${active ? ' gdocs-tb__btn--active' : ''}${className ? ` ${className}` : ''}`}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="gdocs-tb__group">{children}</div>;
}

function currentStyle(editor: Editor): string {
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 1 })) return 'h1';
  return 'paragraph';
}

function parseFontSizePt(editor: Editor): number {
  const raw = editor.getAttributes('textStyle').fontSize as string | undefined;
  if (!raw) return 11;
  const match = raw.match(/^(\d+(?:\.\d+)?)pt$/);
  return match ? Number(match[1]) : 11;
}

export function DocsToolbar({ editor, onInsertImage }: DocsToolbarProps) {
  const currentFont =
    (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? FONT_OPTIONS[0].value;
  const fontSizePt = parseFontSizePt(editor);
  const style = currentStyle(editor);

  const applyStyle = (value: string) => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else if (value === 'title') {
      editor.chain().focus().setHeading({ level: 1 }).run();
    } else if (value === 'h1') {
      editor.chain().focus().setHeading({ level: 1 }).run();
    } else if (value === 'h2') {
      editor.chain().focus().setHeading({ level: 2 }).run();
    }
  };

  const setFontSizePt = (pt: number) => {
    const clamped = Math.min(72, Math.max(8, pt));
    editor.chain().focus().setFontSize(`${clamped}pt`).run();
  };

  const insertLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="gdocs-tb" role="toolbar" aria-label="Formatting">
      <div className="gdocs-tb__bar">
        <ToolbarGroup>
          <label className="gdocs-tb__menus-search">
            <span className="gdocs-tb__menus-label">Menus</span>
            <input type="search" placeholder="Menus" aria-label="Search menus" readOnly tabIndex={-1} />
          </label>
          <ToolbarButton
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <IconUndo />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <IconRedo />
          </ToolbarButton>
          <ToolbarButton title="Print" onClick={() => window.print()}>
            <IconPrint />
          </ToolbarButton>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
          <select
            className="gdocs-tb__select gdocs-tb__select--zoom"
            title="Zoom"
            defaultValue="100"
            onChange={() => {}}
            aria-label="Zoom"
          >
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
          </select>
          <select
            className="gdocs-tb__select"
            title="Style"
            value={style}
            onChange={(e) => applyStyle(e.target.value)}
            aria-label="Text style"
          >
            {STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="gdocs-tb__select gdocs-tb__select--font"
            title="Font"
            value={currentFont}
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontFamily(v).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            aria-label="Font"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="gdocs-tb__size">
            <ToolbarButton
              title="Decrease font size"
              onClick={() => setFontSizePt(fontSizePt - 1)}
              className="gdocs-tb__size-btn"
            >
              −
            </ToolbarButton>
            <select
              className="gdocs-tb__select gdocs-tb__select--size"
              title="Font size"
              value={fontSizePt}
              onChange={(e) => setFontSizePt(Number(e.target.value))}
              aria-label="Font size"
            >
              {FONT_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ToolbarButton
              title="Increase font size"
              onClick={() => setFontSizePt(fontSizePt + 1)}
              className="gdocs-tb__size-btn"
            >
              +
            </ToolbarButton>
          </div>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
          <ToolbarButton
            title="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="gdocs-tb__underline">U</span>
          </ToolbarButton>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
          <ToolbarButton title="Insert link" active={editor.isActive('link')} onClick={insertLink}>
            <IconLink />
          </ToolbarButton>
          <ToolbarButton title="Insert image" onClick={onInsertImage}>
            <IconImage />
          </ToolbarButton>
          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <IconAlignLeft />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <IconAlignCenter />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <IconAlignRight />
          </ToolbarButton>
          <ToolbarButton
            title="Justify"
            active={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <IconAlignJustify />
          </ToolbarButton>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
          <ToolbarButton
            title="Bulleted list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <IconBulletList />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <IconNumberedList />
          </ToolbarButton>
          <ToolbarButton
            title="Decrease indent"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          >
            <IconIndentDecrease />
          </ToolbarButton>
          <ToolbarButton
            title="Increase indent"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          >
            <IconIndentIncrease />
          </ToolbarButton>
        </ToolbarGroup>

        <div className="gdocs-tb__spacer" />

        <ToolbarGroup>
          <select className="gdocs-tb__select gdocs-tb__select--mode" defaultValue="editing" aria-label="Editing mode">
            <option value="editing">Editing</option>
            <option value="suggesting" disabled>
              Suggesting
            </option>
            <option value="viewing" disabled>
              Viewing
            </option>
          </select>
        </ToolbarGroup>

        {editor.isActive('image') ? (
          <>
            <span className="gdocs-tb__sep" />
            <ToolbarGroup>
              <select
                className="gdocs-tb__select"
                title="Image alignment"
                value={(editor.getAttributes('image').align as string) ?? 'center'}
                onChange={(e) =>
                  editor.chain().focus().updateAttributes('image', { align: e.target.value }).run()
                }
                aria-label="Image alignment"
              >
                <option value="left">Image left</option>
                <option value="center">Image center</option>
                <option value="right">Image right</option>
              </select>
              <input
                type="range"
                className="gdocs-tb__range"
                min={120}
                max={720}
                title="Image width"
                value={
                  typeof editor.getAttributes('image').width === 'number'
                    ? editor.getAttributes('image').width
                    : 400
                }
                onChange={(e) =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { width: Number(e.target.value) })
                    .run()
                }
                aria-label="Image width"
              />
            </ToolbarGroup>
          </>
        ) : null}
      </div>
    </div>
  );
}
