import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from 'docx';
import type { ParsedDoc, TipTapNode } from './parse-doc.js';
import { attachmentIdFromSrc } from './parse-doc.js';

type DocxChild = Paragraph | Table;

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

function normalizeHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const hex = value.replace('#', '').trim();
  return /^[0-9a-fA-F]{3,8}$/.test(hex) ? hex : undefined;
}

function fontSizeHalfPoints(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.match(/^(\d+(?:\.\d+)?)pt$/);
  return match ? Math.round(Number(match[1]) * 2) : undefined;
}

function textRuns(nodes: TipTapNode[] | undefined): TextRun[] {
  if (!nodes) return [];
  const runs: TextRun[] = [];
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      runs.push(new TextRun({ text: '', break: 1 }));
      continue;
    }
    if (node.type !== 'text') continue;
    const marks = node.marks ?? [];
    const textStyle = marks.find((m) => m.type === 'textStyle')?.attrs ?? {};
    const highlight = marks.find((m) => m.type === 'highlight')?.attrs ?? undefined;
    const isCode = marks.some((m) => m.type === 'code');
    const fontFamily = textStyle.fontFamily as string | undefined;
    const color = normalizeHex(textStyle.color);
    const highlightFill = highlight ? (normalizeHex(highlight.color) ?? 'FFFF00') : undefined;

    runs.push(
      new TextRun({
        text: node.text ?? '',
        bold: marks.some((m) => m.type === 'bold'),
        italics: marks.some((m) => m.type === 'italic'),
        strike: marks.some((m) => m.type === 'strike'),
        superScript: marks.some((m) => m.type === 'superscript'),
        subScript: marks.some((m) => m.type === 'subscript'),
        underline: marks.some((m) => m.type === 'underline')
          ? { type: UnderlineType.SINGLE }
          : undefined,
        font: isCode ? { name: 'Courier New' } : fontFamily ? { name: fontFamily } : undefined,
        size: fontSizeHalfPoints(textStyle.fontSize),
        color,
        shading: highlightFill
          ? { type: ShadingType.CLEAR, fill: highlightFill, color: 'auto' }
          : undefined,
      }),
    );
  }
  return runs;
}

function imageParagraph(block: TipTapNode, resolveImage: DocxImageResolver): Paragraph | null {
  const src = String(block.attrs?.src ?? '');
  const attachmentId = attachmentIdFromSrc(src);
  if (!attachmentId) return null;
  const img = resolveImage(attachmentId);
  if (!img) return null;
  const width = typeof block.attrs?.width === 'number' ? block.attrs.width : 400;
  const height =
    typeof block.attrs?.height === 'number' ? block.attrs.height : Math.round(width * 0.75);
  const wrap = (block.attrs?.wrap as string) ?? 'none';
  const align =
    wrap === 'left' ? 'left' : wrap === 'right' ? 'right' : (block.attrs?.align as string) ?? 'center';
  return new Paragraph({
    alignment: alignmentFromAttr(align),
    children: [
      new ImageRun({ type: 'png', data: img.data, transformation: { width, height } }),
    ],
  });
}

function tableCellChildren(cell: TipTapNode, resolveImage: DocxImageResolver): Paragraph[] {
  const children = blocksToChildren(cell.content ?? [], resolveImage).filter(
    (c): c is Paragraph => c instanceof Paragraph,
  );
  return children.length > 0 ? children : [new Paragraph({})];
}

function buildTable(block: TipTapNode, resolveImage: DocxImageResolver): Table {
  const rows = (block.content ?? [])
    .filter((row) => row.type === 'tableRow')
    .map((row) => {
      const cells = (row.content ?? [])
        .filter((cell) => cell.type === 'tableCell' || cell.type === 'tableHeader')
        .map(
          (cell) =>
            new TableCell({
              children: tableCellChildren(cell, resolveImage),
              columnSpan: (cell.attrs?.colspan as number) ?? undefined,
              rowSpan: (cell.attrs?.rowspan as number) ?? undefined,
              shading:
                cell.type === 'tableHeader'
                  ? { type: ShadingType.CLEAR, fill: 'F1F3F4', color: 'auto' }
                  : undefined,
            }),
        );
      return new TableRow({ children: cells });
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function blocksToChildren(blocks: TipTapNode[], resolveImage: DocxImageResolver): DocxChild[] {
  const result: DocxChild[] = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      result.push(
        new Paragraph({
          heading: headingLevel((block.attrs?.level as number) ?? 2),
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

    if (block.type === 'taskList') {
      for (const item of block.content ?? []) {
        if (item.type !== 'taskItem') continue;
        const checked = item.attrs?.checked === true;
        const prefix = new TextRun({ text: checked ? '\u2611 ' : '\u2610 ' });
        for (const child of item.content ?? []) {
          if (child.type === 'paragraph') {
            result.push(new Paragraph({ children: [prefix, ...textRuns(child.content)] }));
          }
        }
      }
      continue;
    }

    if (block.type === 'codeBlock') {
      result.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: 'F4F4F4', color: 'auto' },
          children: [new TextRun({ text: block.content?.[0]?.text ?? '', font: { name: 'Courier New' } })],
        }),
      );
      continue;
    }

    if (block.type === 'horizontalRule') {
      result.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 1 } },
          children: [],
        }),
      );
      continue;
    }

    if (block.type === 'blockquote') {
      result.push(...blocksToChildren(block.content ?? [], resolveImage));
      continue;
    }

    if (block.type === 'table') {
      result.push(buildTable(block, resolveImage));
      continue;
    }

    if (block.type === 'image') {
      const para = imageParagraph(block, resolveImage);
      if (para) result.push(para);
      continue;
    }

    if (block.content) {
      result.push(...blocksToChildren(block.content, resolveImage));
    }
  }

  return result;
}

export async function tiptapToDocxBuffer(
  doc: ParsedDoc,
  resolveImage: DocxImageResolver,
): Promise<Buffer> {
  const children: DocxChild[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: doc.title, bold: true })],
    }),
    ...blocksToChildren(doc.blocks, resolveImage),
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
