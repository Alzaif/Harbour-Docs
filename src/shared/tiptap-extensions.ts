import type { AnyExtension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

function numericAttr(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

type HtmlElementLike = {
  getAttribute(name: string): string | null;
  style: { width?: string; height?: string };
};

/** Image schema shared with editor CustomImage (without React node view). */
export const DocsImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) =>
          numericAttr(
            (element as HtmlElementLike).getAttribute('width') ??
              (element as HtmlElementLike).style.width,
          ),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const w =
            typeof attributes.width === 'number' ? `${attributes.width}px` : String(attributes.width);
          return { width: attributes.width, style: `width:${w}` };
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          numericAttr(
            (element as HtmlElementLike).getAttribute('height') ??
              (element as HtmlElementLike).style.height,
          ),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) => (element as HtmlElementLike).getAttribute('data-align') ?? 'center',
        renderHTML: (attributes) => ({ 'data-align': (attributes.align as string) ?? 'center' }),
      },
      wrap: {
        default: 'none',
        parseHTML: (element) => (element as HtmlElementLike).getAttribute('data-wrap') ?? 'none',
        renderHTML: (attributes) => ({ 'data-wrap': (attributes.wrap as string) ?? 'none' }),
      },
    };
  },
});

export interface CreateDocsTipTapExtensionsOptions {
  /** Override image extension (e.g. CustomImage in the editor). */
  image?: AnyExtension;
}

export function createDocsTipTapExtensions(
  options: CreateDocsTipTapExtensionsOptions = {},
): AnyExtension[] {
  const image =
    options.image ??
    DocsImage.configure({
      inline: false,
      allowBase64: false,
    });

  return [
    StarterKit.configure({ link: false, underline: false }),
    Link.configure({ openOnClick: false, autolink: true }),
    Underline,
    TextStyle,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    image,
  ];
}
