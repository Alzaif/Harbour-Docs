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
        for (const mark of node.marks ?? []) {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'underline') text = `<u>${text}</u>`;
          if (mark.type === 'code') text = `<code>${text}</code>`;
          if (mark.type === 'link' && typeof mark.attrs?.href === 'string') {
            text = `<a href="${escapeHtml(mark.attrs.href)}">${text}</a>`;
          }
          if (mark.type === 'textStyle' && typeof mark.attrs?.fontFamily === 'string') {
            text = `<span style="font-family:${escapeHtml(mark.attrs.fontFamily)}">${text}</span>`;
          }
        }
        return text;
      }
      if (node.type === 'hardBreak') return '<br />';
      return inlineHtml(node.content);
    })
    .join('');
}

function blockToHtml(node: TipTapNode, resolveImage: ImageResolver): string {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const tag = `h${Math.min(6, Math.max(1, level))}`;
      const align = node.attrs?.textAlign as string | undefined;
      const style = align ? ` style="text-align:${align}"` : '';
      return `<${tag}${style}>${inlineHtml(node.content)}</${tag}>`;
    }
    case 'paragraph': {
      const align = node.attrs?.textAlign as string | undefined;
      const style = align ? ` style="text-align:${align}"` : '';
      const inner = inlineHtml(node.content);
      return inner ? `<p${style}>${inner}</p>` : '<p><br /></p>';
    }
    case 'bulletList':
      return `<ul>${(node.content ?? []).map((item) => blockToHtml(item, resolveImage)).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${(node.content ?? []).map((item) => blockToHtml(item, resolveImage)).join('')}</ol>`;
    case 'listItem':
      return `<li>${(node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('')}</li>`;
    case 'blockquote':
      return `<blockquote>${(node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('')}</blockquote>`;
    case 'image': {
      const src = String(node.attrs?.src ?? '');
      const align = (node.attrs?.align as string) ?? 'center';
      const width = node.attrs?.width as number | string | null | undefined;
      const attachmentId = attachmentIdFromSrc(src);
      let imgSrc = src;
      if (attachmentId) {
        const resolved = resolveImage(attachmentId);
        if (resolved) imgSrc = resolved.dataUrl;
      }
      const widthStyle =
        width != null && width !== '' ? `max-width:${typeof width === 'number' ? `${width}px` : width};` : 'max-width:100%;';
      return `<figure style="text-align:${align};margin:1rem 0"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(String(node.attrs?.alt ?? ''))}" style="${widthStyle}height:auto;display:inline-block" /></figure>`;
    }
    default:
      return (node.content ?? []).map((child) => blockToHtml(child, resolveImage)).join('');
  }
}

export function tiptapToHtml(doc: ParsedDoc, resolveImage: ImageResolver): string {
  const body = doc.blocks.map((block) => blockToHtml(block, resolveImage)).join('\n');
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
</style>
</head>
<body>
<h1>${escapeHtml(doc.title)}</h1>
${body}
</body>
</html>`;
}
