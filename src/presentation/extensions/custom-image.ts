import Image from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width') ?? element.style.width;
          if (!width) return null;
          const n = parseInt(width, 10);
          return Number.isNaN(n) ? width : n;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          const w =
            typeof attributes.width === 'number'
              ? `${attributes.width}px`
              : String(attributes.width);
          return { width: w, style: `width:${w}` };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
        renderHTML: (attributes) => {
          const align = (attributes.align as string) ?? 'center';
          return { 'data-align': align, style: `display:block;margin:0 auto;text-align:${align}` };
        },
      },
    };
  },
});
