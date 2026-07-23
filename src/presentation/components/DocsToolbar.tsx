import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBlockquote,
  IconBulletList,
  IconChecklist,
  IconClearFormat,
  IconCode,
  IconFindReplace,
  IconHighlight,
  IconHorizontalRule,
  IconImage,
  IconIndentDecrease,
  IconIndentIncrease,
  IconLineSpacing,
  IconLink,
  IconNumberedList,
  IconPrint,
  IconRedo,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTable,
  IconTextColor,
  IconUndo,
  IconWrapLeft,
  IconWrapNone,
  IconWrapRight,
} from './DocsIcons.js';

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
] as const;

const STYLE_OPTIONS = [
  { label: 'Normal text', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
] as const;

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72] as const;

const LINE_SPACING = [
  { label: 'Single', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: 'Double', value: '2' },
] as const;

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8',
  '#0000ff', '#9900ff', '#ff00ff', '#e6b8af', '#fce5cd', '#d9ead3', '#cfe2f3',
] as const;

const HIGHLIGHT_COLORS = [
  '#fff2cc', '#fce5cd', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff9900', '#ff0000',
] as const;

interface DocsToolbarProps {
  readonly editor: Editor;
  readonly onInsertImage: () => void;
  readonly onOpenFind: () => void;
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

function Popover({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="gdocs-tb__popover" ref={ref}>
      <button
        type="button"
        className="gdocs-tb__btn gdocs-tb__btn--popover"
        title={title}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
        <span className="gdocs-tb__caret" aria-hidden>
          ▾
        </span>
      </button>
      {open ? <div className="gdocs-tb__popover-panel">{children(() => setOpen(false))}</div> : null}
    </div>
  );
}

function currentStyle(editor: Editor): string {
  if (editor.isActive('heading', { level: 1 })) return 'h1';
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  return 'paragraph';
}

function parseFontSizePt(editor: Editor): number {
  const raw = editor.getAttributes('textStyle').fontSize as string | undefined;
  if (!raw) return 11;
  const match = raw.match(/^(\d+(?:\.\d+)?)pt$/);
  return match ? Number(match[1]) : 11;
}

export function DocsToolbar({ editor, onInsertImage, onOpenFind }: DocsToolbarProps) {
  const currentFont =
    (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? FONT_OPTIONS[0].value;
  const fontSizePt = parseFontSizePt(editor);
  const style = currentStyle(editor);
  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '#000000';
  const imageActive = editor.isActive('image');

  const applyStyle = (value: string) => {
    if (value === 'paragraph') editor.chain().focus().setParagraph().run();
    else if (value === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
    else if (value === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
    else if (value === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
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

  const clearFormatting = () =>
    editor.chain().focus().unsetAllMarks().clearNodes().run();

  const setImageAttr = (attrs: Record<string, unknown>) =>
    editor.chain().focus().updateAttributes('image', attrs).run();

  return (
    <div className="gdocs-tb" role="toolbar" aria-label="Formatting">
      <div className="gdocs-tb__bar">
        <ToolbarGroup>
          <ToolbarButton
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <IconUndo />
          </ToolbarButton>
          <ToolbarButton
            title="Redo (Ctrl+Y)"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <IconRedo />
          </ToolbarButton>
          <ToolbarButton title="Print (Ctrl+P)" onClick={() => window.print()}>
            <IconPrint />
          </ToolbarButton>
          <ToolbarButton title="Find and replace (Ctrl+F)" onClick={onOpenFind}>
            <IconFindReplace />
          </ToolbarButton>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
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
            title="Bold (Ctrl+B)"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            title="Italic (Ctrl+I)"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            title="Underline (Ctrl+U)"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="gdocs-tb__underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <IconStrikethrough />
          </ToolbarButton>

          <Popover
            title="Text color"
            trigger={
              <span className="gdocs-tb__color-trigger" style={{ borderBottomColor: currentColor }}>
                <IconTextColor />
              </span>
            }
          >
            {(close) => (
              <>
                <div className="gdocs-tb__swatches">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="gdocs-tb__swatch"
                      style={{ background: c }}
                      title={c}
                      onClick={() => {
                        editor.chain().focus().setColor(c).run();
                        close();
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="gdocs-tb__swatch-reset"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    close();
                  }}
                >
                  Reset color
                </button>
              </>
            )}
          </Popover>

          <Popover title="Highlight color" trigger={<IconHighlight />}>
            {(close) => (
              <>
                <div className="gdocs-tb__swatches">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="gdocs-tb__swatch"
                      style={{ background: c }}
                      title={c}
                      onClick={() => {
                        editor.chain().focus().setHighlight({ color: c }).run();
                        close();
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="gdocs-tb__swatch-reset"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    close();
                  }}
                >
                  No highlight
                </button>
              </>
            )}
          </Popover>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
          <ToolbarButton
            title="Superscript"
            active={editor.isActive('superscript')}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            <IconSuperscript />
          </ToolbarButton>
          <ToolbarButton
            title="Subscript"
            active={editor.isActive('subscript')}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          >
            <IconSubscript />
          </ToolbarButton>
          <ToolbarButton
            title="Inline code"
            active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <IconCode />
          </ToolbarButton>
          <ToolbarButton title="Clear formatting" onClick={clearFormatting}>
            <IconClearFormat />
          </ToolbarButton>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
          <ToolbarButton title="Insert link (Ctrl+K)" active={editor.isActive('link')} onClick={insertLink}>
            <IconLink />
          </ToolbarButton>
          <ToolbarButton title="Insert image" onClick={onInsertImage}>
            <IconImage />
          </ToolbarButton>
          <ToolbarButton
            title="Insert table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <IconTable />
          </ToolbarButton>
          <ToolbarButton
            title="Horizontal line"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <IconHorizontalRule />
          </ToolbarButton>
        </ToolbarGroup>

        <span className="gdocs-tb__sep" />

        <ToolbarGroup>
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
          <Popover title="Line spacing" trigger={<IconLineSpacing />}>
            {(close) => (
              <div className="gdocs-tb__menu">
                {LINE_SPACING.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className="gdocs-tb__menu-item"
                    onClick={() => {
                      editor.chain().focus().setLineHeight(s.value).run();
                      close();
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </Popover>
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
            title="Checklist"
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <IconChecklist />
          </ToolbarButton>
          <ToolbarButton
            title="Block quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <IconBlockquote />
          </ToolbarButton>
          <ToolbarButton
            title="Code block"
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <IconCode />
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
      </div>

      {imageActive ? (
        <div className="gdocs-tb__bar gdocs-tb__bar--image" role="toolbar" aria-label="Image">
          <span className="gdocs-tb__image-label">Image</span>
          <ToolbarGroup>
            <ToolbarButton
              title="In line (no wrap)"
              active={(editor.getAttributes('image').wrap ?? 'none') === 'none'}
              onClick={() => setImageAttr({ wrap: 'none' })}
            >
              <IconWrapNone />
            </ToolbarButton>
            <ToolbarButton
              title="Wrap text — image left"
              active={editor.getAttributes('image').wrap === 'left'}
              onClick={() => setImageAttr({ wrap: 'left' })}
            >
              <IconWrapLeft />
            </ToolbarButton>
            <ToolbarButton
              title="Wrap text — image right"
              active={editor.getAttributes('image').wrap === 'right'}
              onClick={() => setImageAttr({ wrap: 'right' })}
            >
              <IconWrapRight />
            </ToolbarButton>
          </ToolbarGroup>

          <span className="gdocs-tb__sep" />

          <ToolbarGroup>
            <ToolbarButton
              title="Align left"
              active={(editor.getAttributes('image').align ?? 'center') === 'left'}
              onClick={() => setImageAttr({ align: 'left' })}
            >
              <IconAlignLeft />
            </ToolbarButton>
            <ToolbarButton
              title="Align center"
              active={(editor.getAttributes('image').align ?? 'center') === 'center'}
              onClick={() => setImageAttr({ align: 'center' })}
            >
              <IconAlignCenter />
            </ToolbarButton>
            <ToolbarButton
              title="Align right"
              active={(editor.getAttributes('image').align ?? 'center') === 'right'}
              onClick={() => setImageAttr({ align: 'right' })}
            >
              <IconAlignRight />
            </ToolbarButton>
          </ToolbarGroup>

          <span className="gdocs-tb__sep" />

          <ToolbarGroup>
            <label className="gdocs-tb__image-width">
              Width
              <input
                type="range"
                className="gdocs-tb__range"
                min={60}
                max={1000}
                title="Image width"
                value={
                  typeof editor.getAttributes('image').width === 'number'
                    ? editor.getAttributes('image').width
                    : 320
                }
                onChange={(e) => setImageAttr({ width: Number(e.target.value), height: null })}
                aria-label="Image width"
              />
            </label>
            <ToolbarButton
              title="Reset size"
              onClick={() => setImageAttr({ width: null, height: null })}
            >
              Reset
            </ToolbarButton>
            <ToolbarButton
              title="Add alt text"
              onClick={() => {
                const current = (editor.getAttributes('image').alt as string) ?? '';
                const alt = window.prompt('Alt text (description)', current);
                if (alt !== null) setImageAttr({ alt });
              }}
            >
              Alt
            </ToolbarButton>
            <ToolbarButton
              title="Delete image"
              onClick={() => editor.chain().focus().deleteSelection().run()}
            >
              Delete
            </ToolbarButton>
          </ToolbarGroup>
        </div>
      ) : null}
    </div>
  );
}
