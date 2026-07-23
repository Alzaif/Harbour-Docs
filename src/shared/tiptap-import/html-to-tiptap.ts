import { generateJSON } from '@tiptap/html';
import { createDocsTipTapExtensions } from '../tiptap-extensions.js';

function extractBodyHtml(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1]?.trim() ?? html;
}

export function htmlToTipTapJson(html: string): string {
  const fragment = extractBodyHtml(html);
  const json = generateJSON(fragment, createDocsTipTapExtensions());
  return JSON.stringify(json);
}
