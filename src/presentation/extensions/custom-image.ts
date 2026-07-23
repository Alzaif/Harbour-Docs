import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './image-node-view.js';

function numericAttr(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Image with width/height, block alignment, and text-wrap (float) positioning.
 * Rendered through a React node view that adds drag-to-resize handles.
 */
export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => numericAttr(element.getAttribute('width') ?? element.style.width),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const w =
            typeof attributes.width === 'number' ? `${attributes.width}px` : String(attributes.width);
          return { width: attributes.width, style: `width:${w}` };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => numericAttr(element.getAttribute('height') ?? element.style.height),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
        renderHTML: (attributes) => ({ 'data-align': (attributes.align as string) ?? 'center' }),
      },
      wrap: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-wrap') ?? 'none',
        renderHTML: (attributes) => ({ 'data-wrap': (attributes.wrap as string) ?? 'none' }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
