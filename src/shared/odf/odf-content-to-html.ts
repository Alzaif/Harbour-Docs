import { DOMParser, type Document as XmlDocument, type Element as XmlElement, type Node as XmlNode } from '@xmldom/xmldom';

function localName(node: XmlNode): string {
  if (node.nodeType !== 1) return '';
  const tag = (node as XmlElement).tagName;
  return tag.includes(':') ? tag.split(':').pop()! : tag;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function xlinkHref(element: XmlElement): string | null {
  return (
    element.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ??
    element.getAttribute('xlink:href') ??
    element.getAttribute('href')
  );
}

function collectInlineHtml(node: XmlNode): string {
  if (node.nodeType === 3) {
    return escapeHtml(node.nodeValue ?? '');
  }
  if (node.nodeType !== 1) return '';

  const el = node as XmlElement;
  const name = localName(el);

  switch (name) {
    case 'span':
      return `<span>${collectChildrenInlineHtml(el)}</span>`;
    case 'a': {
      const href = xlinkHref(el) ?? '#';
      return `<a href="${escapeHtml(href)}">${collectChildrenInlineHtml(el)}</a>`;
    }
    case 'line-break':
      return '<br />';
    case 's': {
      const count = Number.parseInt(el.getAttribute('text:c') ?? '1', 10);
      return escapeHtml(' '.repeat(Number.isNaN(count) ? 1 : count));
    }
    case 'tab':
      return '\t';
    default:
      return collectChildrenInlineHtml(el);
  }
}

function collectChildrenInlineHtml(element: XmlElement): string {
  let html = '';
  for (let i = 0; i < element.childNodes.length; i++) {
    html += collectInlineHtml(element.childNodes[i]!);
  }
  return html;
}

function blockTagForList(element: XmlElement): 'ul' | 'ol' {
  const styleName = (element.getAttribute('text:style-name') ?? '').toLowerCase();
  if (styleName.includes('numbered') || styleName.includes('number')) return 'ol';
  return 'ul';
}

function convertBlock(element: XmlElement): string {
  const name = localName(element);

  switch (name) {
    case 'h': {
      const level = Math.min(6, Math.max(1, Number.parseInt(element.getAttribute('text:outline-level') ?? '1', 10) || 1));
      const inner = collectChildrenInlineHtml(element);
      return inner.trim() ? `<h${level}>${inner}</h${level}>` : '';
    }
    case 'p': {
      const inner = collectChildrenInlineHtml(element);
      return inner.trim() || element.getElementsByTagName('*').length > 0
        ? `<p>${inner || '<br />'}</p>`
        : '<p><br /></p>';
    }
    case 'list': {
      const tag = blockTagForList(element);
      const items: string[] = [];
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i]!;
        if (child.nodeType === 1 && localName(child) === 'list-item') {
          items.push(convertListItem(child as XmlElement));
        }
      }
      return items.length ? `<${tag}>${items.join('')}</${tag}>` : '';
    }
    case 'table':
      return convertTable(element);
    case 'section':
    case 'sequence-decls':
      return convertChildren(element);
    case 'frame':
      return convertFrame(element);
    default:
      return convertChildren(element);
  }
}

function convertListItem(element: XmlElement): string {
  const parts: string[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]!;
    if (child.nodeType !== 1) continue;
    const childEl = child as XmlElement;
    const childName = localName(childEl);
    if (childName === 'list') {
      parts.push(convertBlock(childEl));
    } else {
      parts.push(convertBlock(childEl));
    }
  }
  return `<li>${parts.join('')}</li>`;
}

function convertTable(element: XmlElement): string {
  const rows: string[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]!;
    if (child.nodeType === 1 && localName(child) === 'table-row') {
      rows.push(convertTableRow(child as XmlElement));
    }
  }
  return rows.length ? `<table>${rows.join('')}</table>` : '';
}

function convertTableRow(element: XmlElement): string {
  const cells: string[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]!;
    if (child.nodeType !== 1) continue;
    const childName = localName(child);
    if (childName === 'table-cell' || childName === 'table-header-cell') {
      cells.push(convertTableCell(child as XmlElement, childName === 'table-header-cell'));
    }
  }
  return `<tr>${cells.join('')}</tr>`;
}

function convertTableCell(element: XmlElement, header: boolean): string {
  const tag = header ? 'th' : 'td';
  return `<${tag}>${convertChildren(element)}</${tag}>`;
}

function convertFrame(element: XmlElement): string {
  const parts: string[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]!;
    if (child.nodeType !== 1) continue;
    const childEl = child as XmlElement;
    const childName = localName(childEl);
    if (childName === 'image') {
      const href = xlinkHref(childEl);
      if (href) parts.push(`<img src="${escapeHtml(href)}" alt="" />`);
    } else {
      parts.push(convertBlock(childEl));
    }
  }
  return parts.join('');
}

function convertChildren(element: XmlElement): string {
  const parts: string[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]!;
    if (child.nodeType !== 1) continue;
    parts.push(convertBlock(child as XmlElement));
  }
  return parts.join('\n');
}

function findOfficeTextRoot(doc: XmlDocument): XmlElement | null {
  const body = doc.getElementsByTagName('*');
  for (let i = 0; i < body.length; i++) {
    const el = body[i] as XmlElement;
    if (localName(el) === 'text') return el;
  }
  return null;
}

export function odfContentXmlToHtml(contentXml: string): string {
  const doc = new DOMParser().parseFromString(contentXml, 'text/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error('Invalid ODT content.xml');
  }

  const textRoot = findOfficeTextRoot(doc);
  if (!textRoot) {
    return '<p></p>';
  }

  const body = convertChildren(textRoot).trim();
  return body || '<p></p>';
}

export function wrapOdfHtmlBody(bodyHtml: string, title = 'Imported document'): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function odfHtmlHasSubstantiveText(html: string): boolean {
  const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > 0;
}
