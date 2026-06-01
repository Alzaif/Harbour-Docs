import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  UnderlineType,
} from 'docx';
import type { ParsedDoc, TipTapNode } from './parse-doc.js';
import { attachmentIdFromSrc } from './parse-doc.js';

export type DocxImageResolver = (
  attachmentId: string,
) => { data: Buffer; width?: number; height?: number } | null;

function headingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  } as const;
  return map[level as keyof typeof map] ?? HeadingLevel.HEADING_2;
}

function alignmentFromAttr(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  if (align === 'justify') return AlignmentType.JUSTIFIED;
  if (align === 'left') return AlignmentType.LEFT;
  return undefined;
}

function textRuns(nodes: TipTapNode[] | undefined): TextRun[] {
  if (!nodes) return [];
  const runs: TextRun[] = [];
  for (const node of nodes) {
    if (node.type !== 'text') continue;
    const marks = node.marks ?? [];
    const fontFamily = marks.find((m) => m.type === 'textStyle')?.attrs?.fontFamily as
      | string
      | undefined;
    runs.push(
      new TextRun({
        text: node.text ?? '',
        bold: marks.some((m) => m.type === 'bold'),
        italics: marks.some((m) => m.type === 'italic'),
        underline: marks.some((m) => m.type === 'underline')
          ? { type: UnderlineType.SINGLE }
          : undefined,
        font: fontFamily ? { name: fontFamily } : undefined,
      }),
    );
  }
  return runs;
}

function blocksToParagraphs(
  blocks: TipTapNode[],
  resolveImage: DocxImageResolver,
): Paragraph[] {
  const result: Paragraph[] = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      const level = (block.attrs?.level as number) ?? 2;
      result.push(
        new Paragraph({
          heading: headingLevel(level),
          alignment: alignmentFromAttr(block.attrs?.textAlign as string | undefined),
          children: textRuns(block.content),
        }),
      );
      continue;
    }

    if (block.type === 'paragraph') {
      const runs = textRuns(block.content);
      result.push(
        new Paragraph({
          alignment: alignmentFromAttr(block.attrs?.textAlign as string | undefined),
          children: runs.length > 0 ? runs : [new TextRun('')],
        }),
      );
      continue;
    }

    if (block.type === 'bulletList' || block.type === 'orderedList') {
      for (const item of block.content ?? []) {
        if (item.type !== 'listItem') continue;
        for (const child of item.content ?? []) {
          if (child.type === 'paragraph') {
            result.push(
              new Paragraph({
                bullet: block.type === 'bulletList' ? { level: 0 } : undefined,
                numbering:
                  block.type === 'orderedList'
                    ? { reference: 'default-numbering', level: 0 }
                    : undefined,
                children: textRuns(child.content),
              }),
            );
          }
        }
      }
      continue;
    }

    if (block.type === 'blockquote') {
      for (const child of block.content ?? []) {
        result.push(...blocksToParagraphs([child], resolveImage));
      }
      continue;
    }

    if (block.type === 'image') {
      const src = String(block.attrs?.src ?? '');
      const attachmentId = attachmentIdFromSrc(src);
      if (attachmentId) {
        const img = resolveImage(attachmentId);
        if (img) {
          const width = typeof block.attrs?.width === 'number' ? block.attrs.width : 400;
          const height = Math.round(width * 0.75);
          result.push(
            new Paragraph({
              alignment: alignmentFromAttr((block.attrs?.align as string) ?? 'center'),
              children: [
                new ImageRun({
                  type: 'png',
                  data: img.data,
                  transformation: { width, height },
                }),
              ],
            }),
          );
        }
      }
      continue;
    }

    if (block.content) {
      result.push(...blocksToParagraphs(block.content, resolveImage));
    }
  }

  return result;
}

export async function tiptapToDocxBuffer(
  doc: ParsedDoc,
  resolveImage: DocxImageResolver,
): Promise<Buffer> {
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: doc.title, bold: true })],
    }),
    ...blocksToParagraphs(doc.blocks, resolveImage),
  ];

  const document = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(document));
}
