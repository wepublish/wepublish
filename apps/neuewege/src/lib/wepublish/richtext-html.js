// we.publish richtext (tiptap / ProseMirror JSON) → HTML, in the tag
// vocabulary of the old Drupal markup the components and CSS expect
// (p, br, strong, em, u, s, sup, sub, a, h1–h6, ul/ol/li, blockquote, table).
// Inverse of the importer's converter (importers/neuewege/content/lib/richtext.ts).

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeText = text => text.replace(/[&<>]/g, c => ESCAPES[c]);
const escapeAttr = text => String(text).replace(/[&<>"]/g, c => ESCAPES[c]);

// Marks are applied innermost-last: link outermost, like the source markup.
const MARK_ORDER = [
  'link',
  'bold',
  'italic',
  'underline',
  'strike',
  'superscript',
  'subscript',
];
const MARK_TAGS = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strike: 's',
  superscript: 'sup',
  subscript: 'sub',
};

function openMark(mark) {
  if (mark.type === 'link') {
    const attrs = mark.attrs || {};
    let html = `<a href="${escapeAttr(attrs.href || '')}"`;
    if (attrs.target) html += ` target="${escapeAttr(attrs.target)}"`;
    if (attrs.rel) html += ` rel="${escapeAttr(attrs.rel)}"`;
    return `${html}>`;
  }
  return MARK_TAGS[mark.type] ? `<${MARK_TAGS[mark.type]}>` : '';
}

function closeMark(mark) {
  if (mark.type === 'link') return '</a>';
  return MARK_TAGS[mark.type] ? `</${MARK_TAGS[mark.type]}>` : '';
}

function textNode(node) {
  const marks = [...(node.marks || [])].sort(
    (a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type)
  );
  return (
    marks.map(openMark).join('') +
    escapeText(node.text || '') +
    [...marks].reverse().map(closeMark).join('')
  );
}

function children(node) {
  return (node.content || []).map(render).join('');
}

function render(node) {
  switch (node.type) {
    case 'doc':
      return children(node);
    case 'text':
      return textNode(node);
    case 'hardBreak':
      return '<br>';
    case 'paragraph':
      return `<p>${children(node)}</p>`;
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 3));
      return `<h${level}>${children(node)}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${children(node)}</ul>`;
    case 'orderedList': {
      const start = Number(node.attrs?.start ?? 1);
      return start === 1 ?
          `<ol>${children(node)}</ol>`
        : `<ol start="${start}">${children(node)}</ol>`;
    }
    case 'listItem':
      return `<li>${children(node)}</li>`;
    case 'blockquote':
      return `<blockquote>${children(node)}</blockquote>`;
    case 'table':
      return `<table><tbody>${children(node)}</tbody></table>`;
    case 'tableRow':
      return `<tr>${children(node)}</tr>`;
    case 'tableHeader':
    case 'tableCell': {
      const tag = node.type === 'tableHeader' ? 'th' : 'td';
      const a = node.attrs || {};
      const span =
        (a.colspan > 1 ? ` colspan="${a.colspan}"` : '') +
        (a.rowspan > 1 ? ` rowspan="${a.rowspan}"` : '');
      return `<${tag}${span}>${children(node)}</${tag}>`;
    }
    case 'horizontalRule':
      return '<hr>';
    default:
      return children(node);
  }
}

export function tiptapToHtml(doc) {
  if (!doc || typeof doc !== 'object') return '';
  return render(doc);
}

/** Split a doc at top-level horizontal rules (event descriptions: column 1 | column 2). */
export function splitAtRules(doc) {
  const parts = [[]];
  for (const node of doc?.content || []) {
    if (node.type === 'horizontalRule') parts.push([]);
    else parts[parts.length - 1].push(node);
  }
  return parts.map(content => ({ type: 'doc', content }));
}

// Plain text of a document (block nodes joined by spaces), e.g. for the
// member-plan descriptions in radio labels. Empty documents give ''.
export function tiptapToText(doc) {
  const blocks = [];
  const walk = (node, parts) => {
    if (node.type === 'text') parts.push(node.text || '');
    else if (node.type === 'hardBreak') parts.push(' ');
    for (const child of node.content || []) walk(child, parts);
  };
  for (const block of doc?.content || []) {
    const parts = [];
    walk(block, parts);
    blocks.push(parts.join('').trim());
  }
  return blocks.filter(Boolean).join(' ');
}
