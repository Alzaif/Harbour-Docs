import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (value: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

const DEFAULT_TYPES = ['heading', 'paragraph'];

/** Paragraph/heading line spacing, applied as an inline style on block nodes. */
export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: DEFAULT_TYPES,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (value: string) =>
        ({ commands }) =>
          this.options.types
            .map((type: string) => commands.updateAttributes(type, { lineHeight: value }))
            .every(Boolean),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          this.options.types
            .map((type: string) => commands.resetAttributes(type, 'lineHeight'))
            .every(Boolean),
    };
  },
});
