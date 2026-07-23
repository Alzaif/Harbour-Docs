import type { ParsedDoc, TipTapNode } from './parse-doc.js';
import { attachmentIdFromSrc } from './parse-doc.js';

export type ImageResolver = (attachmentId: string) => { dataUrl: string; mimeType: string } | null;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineHtml(nodes: TipTapNode[] | undefined): string {
  if (!nodes) return '';
  return nodes
    .map((node) => {
      if (node.type === 'text') {
        let text = escapeHtml(node.text ?? '');
        const styles: string[] = [];
        for (const mark of node.marks ?? []) {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'underline') text = `<u>${text}</u>`;
          if (mark.type === 'strike') text = `<s>${text}</s>`;
          if (mark.type === 'code') text = `<code>${text}</code>`;
          if (mark.type === 'subscript') text = `<sub>${text}</sub>`;
          if (mark.type === 'superscript') text = `<sup>${text}</sup>`;
          if (mark.type === 'link' && typeof mark.attrs?.href === 'string') {
            text = `<a href="${escapeHtml(mark.attrs.href)}">${text}</a>`;
          }
          if (mark.type === 'highlight' && typeof mark.attrs?.color === 'string') {
            styles.push(`background-color:${escapeHtml(mark.attrs.color)}`);
          } else if (mark.type === 'highlight') {
            styles.push('background-color:#fff2cc');
          }
          if (mark.type === 'textStyle') {
            if (typeof mark.attrs?.fontFamily === 'string') {
              styles.push(`font-family:${escapeHtml(mark.attrs.fontFamily)}`);
            }
            if (typeof mark.attrs?.fontSize === 'string') {
              styles.push(`font-size:${escapeHtml(mark.attrs.fontSize)}`);
            }
            if (typeof mark.attrs?.color === 'string') {
              styles.push(`color:${escapeHtml(mark.attrs.color)}`);
            }
          }
        }
        if (styles.length > 0) text = `<span style="${styles.join(';')}">${text}</span>`;
        return text;
      }
      if (node.type === 'hardBreak') return '<br />';
      return inlineHtml(node.content);
    })
    .join('');
}

function blockStyle(node: TipTapNode): string {
  const parts: string[] = [];
  const align = node.attrs?.textAlign as string | undefined;
  if (align) parts.push(`text-align:${align}`);
  const lineHeight = node.attrs?.lineHeight as string | undefined;
  if (lineHeight) parts.push(`line-height:${lineHeight}`);
  return parts.length ? ` style="${parts.join(';')}"` : '';
}

function blockToHtml(node: TipTapNode, resolveImage: ImageResolver): string {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const tag = `h${Math.min(6, Math.max(1, level))}`;
      return `<${tag}${blockStyle(node)}>${inlineHtml(node.content)}</${tag}>`;
    }
    case 'paragraph': {
      const inner = inlineHtml(node.content);
      const style = blockStyle(node);
      return inner ? `<p${style}>${inner}</p>` : '<p><br /></p>';
    }
    case 'bulletList':
      return `<ul>${(node.content ?? []).map((item) => blockToHtml(item, resolveImage)).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${(node.content ?? []).map((item) => blockToHtml(item, resolveImage)).join('')}</ol>`;
    case 'listItem':
      return `<li>${(node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('')}</li>`;
    case 'taskList':
      return `<ul class="task-list" style="list-style:none;padding-left:0">${(node.content ?? [])
        .map((item) => blockToHtml(item, resolveImage))
        .join('')}</ul>`;
    case 'taskItem': {
      const checked = node.attrs?.checked === true;
      const box = `<input type="checkbox" disabled${checked ? ' checked' : ''} style="margin-right:0.5em" />`;
      const body = (node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('');
      return `<li style="list-style:none;display:flex;align-items:flex-start;gap:0.25em">${box}<div>${body}</div></li>`;
    }
    case 'blockquote':
      return `<blockquote>${(node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('')}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${inlineHtml(node.content)}</code></pre>`;
    case 'horizontalRule':
      return '<hr />';
    case 'table':
      return `<table style="border-collapse:collapse;width:100%">${(node.content ?? [])
        .map((row) => blockToHtml(row, resolveImage))
        .join('')}</table>`;
    case 'tableRow':
      return `<tr>${(node.content ?? []).map((cell) => blockToHtml(cell, resolveImage)).join('')}</tr>`;
    case 'tableHeader': {
      const span = cellSpanAttrs(node);
      return `<th${span} style="border:1px solid #bbb;padding:6px;background:#f1f3f4;text-align:left">${(node.content ?? [])
        .map((child) => blockToHtml(child, resolveImage))
        .join('')}</th>`;
    }
    case 'tableCell': {
      const span = cellSpanAttrs(node);
      return `<td${span} style="border:1px solid #bbb;padding:6px">${(node.content ?? [])
        .map((child) => blockToHtml(child, resolveImage))
        .join('')}</td>`;
    }
    case 'image': {
      const src = String(node.attrs?.src ?? '');
      const align = (node.attrs?.align as string) ?? 'center';
      const wrap = (node.attrs?.wrap as string) ?? 'none';
      const width = node.attrs?.width as number | string | null | undefined;
      const attachmentId = attachmentIdFromSrc(src);
      let imgSrc = src;
      if (attachmentId) {
        const resolved = resolveImage(attachmentId);
        if (resolved) imgSrc = resolved.dataUrl;
      }
      const widthCss =
        width != null && width !== ''
          ? `width:${typeof width === 'number' ? `${width}px` : width};`
          : 'max-width:100%;';
      const img = `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(String(node.attrs?.alt ?? ''))}" style="${widthCss}height:auto" />`;
      if (wrap === 'left') {
        return `<span style="float:left;margin:0.25rem 1rem 0.5rem 0">${img}</span>`;
      }
      if (wrap === 'right') {
        return `<span style="float:right;margin:0.25rem 0 0.5rem 1rem">${img}</span>`;
      }
      const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
      return `<figure style="display:flex;justify-content:${justify};margin:1rem 0">${img}</figure>`;
    }
    default:
      return (node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('');
  }
}

function cellSpanAttrs(node: TipTapNode): string {
  const parts: string[] = [];
  const colspan = node.attrs?.colspan as number | undefined;
  const rowspan = node.attrs?.rowspan as number | undefined;
  if (colspan && colspan > 1) parts.push(` colspan="${colspan}"`);
  if (rowspan && rowspan > 1) parts.push(` rowspan="${rowspan}"`);
  return parts.join('');
}

export interface TiptapToHtmlOptions {
  /** When false, omit document title from PDF/HTML body (default true for backward compatibility). */
  includeDocumentTitle?: boolean;
}

export function tiptapToHtml(
  doc: ParsedDoc,
  resolveImage: ImageResolver,
  options: TiptapToHtmlOptions = {},
): string {
  const includeDocumentTitle = options.includeDocumentTitle !== false;
  const body = doc.blocks.map((block) => blockToHtml(block, resolveImage)).join('\n');
  const titleHeading = includeDocumentTitle
    ? `<h1>${escapeHtml(doc.title)}</h1>\n`
    : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 2cm; }
  h1,h2,h3 { font-family: Arial, Helvetica, sans-serif; }
  blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #444; }
  code { font-family: monospace; background: #f4f4f4; padding: 0.1em 0.25em; }
  pre { background: #f4f4f4; padding: 0.75em 1em; border-radius: 4px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; }
  hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
  img { max-width: 100%; }
</style>
</head>
<body>
${titleHeading}${body}
</body>
</html>`;
}
