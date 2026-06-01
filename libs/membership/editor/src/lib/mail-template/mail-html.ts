import { Descendant, Text } from 'slate';
import { BlockFormat, InlineFormat, TextFormat } from '@wepublish/richtext';
import {
  formatPlaceholder,
  PlaceholderSyntax,
  placeholderTokenRegExp,
} from './placeholder-syntax';

export const PLACEHOLDER_TYPE = 'mail-placeholder';

export interface PlaceholderElement {
  type: typeof PLACEHOLDER_TYPE;
  placeholderKey: string;
  children: [{ text: '' }];
}

export const createPlaceholderNode = (key: string): PlaceholderElement => ({
  type: PLACEHOLDER_TYPE,
  placeholderKey: key,
  children: [{ text: '' }],
});

export const createEmptyDocument = (): Descendant[] => [
  { type: BlockFormat.Paragraph, children: [{ text: '' }] } as Descendant,
];

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttribute = (value: string): string =>
  escapeHtml(value).replace(/"/g, '&quot;');

// Inline styles kept intentionally simple and table/inline-safe for broad
// mail-client support.
const STYLES: Record<string, string> = {
  [BlockFormat.Paragraph]: 'margin:0 0 16px 0;',
  [BlockFormat.H1]: 'margin:0 0 16px 0;font-size:28px;line-height:1.3;',
  [BlockFormat.H2]: 'margin:0 0 14px 0;font-size:22px;line-height:1.3;',
  [BlockFormat.H3]: 'margin:0 0 12px 0;font-size:18px;line-height:1.3;',
  [BlockFormat.UnorderedList]: 'margin:0 0 16px 0;padding-left:24px;',
  [BlockFormat.OrderedList]: 'margin:0 0 16px 0;padding-left:24px;',
  [BlockFormat.ListItem]: 'margin:0 0 4px 0;',
  [InlineFormat.Link]: 'color:#1a73e8;text-decoration:underline;',
};

const serializeText = (node: Text): string => {
  let text = escapeHtml(node.text);

  // Preserve empty leaves so the surrounding block keeps its height.
  if (!text) {
    return '';
  }

  if ((node as never)[TextFormat.Bold]) {
    text = `<strong>${text}</strong>`;
  }
  if ((node as never)[TextFormat.Italic]) {
    text = `<em>${text}</em>`;
  }
  if ((node as never)[TextFormat.Underline]) {
    text = `<u>${text}</u>`;
  }
  if ((node as never)[TextFormat.Strikethrough]) {
    text = `<del>${text}</del>`;
  }

  return text;
};

const serializeNode = (node: Descendant, syntax: PlaceholderSyntax): string => {
  if (Text.isText(node)) {
    return serializeText(node);
  }

  const element = node as never as {
    type: string;
    url?: string;
    placeholderKey?: string;
    children: Descendant[];
  };

  if (element.type === PLACEHOLDER_TYPE) {
    return formatPlaceholder(element.placeholderKey ?? '', syntax);
  }

  const children = element.children
    .map(child => serializeNode(child, syntax))
    .join('');
  const style = STYLES[element.type];
  const styleAttr = style ? ` style="${style}"` : '';

  switch (element.type) {
    case BlockFormat.H1:
      return `<h1${styleAttr}>${children}</h1>`;
    case BlockFormat.H2:
      return `<h2${styleAttr}>${children}</h2>`;
    case BlockFormat.H3:
      return `<h3${styleAttr}>${children}</h3>`;
    case BlockFormat.UnorderedList:
      return `<ul${styleAttr}>${children}</ul>`;
    case BlockFormat.OrderedList:
      return `<ol${styleAttr}>${children}</ol>`;
    case BlockFormat.ListItem:
      return `<li${styleAttr}>${children}</li>`;
    case InlineFormat.Link:
      return `<a href="${escapeAttribute(
        element.url ?? '#'
      )}"${styleAttr}>${children}</a>`;
    case BlockFormat.Paragraph:
    default:
      return `<p${styleAttr}>${children || '&nbsp;'}</p>`;
  }
};

const MAIL_BODY_MARKER = 'mail-body';

/**
 * Wraps the serialized body in a table-based, responsive (max-width 600px)
 * email shell using only constructs broadly supported by mail clients.
 */
const wrapInEmailShell = (body: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f4f4f4;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;">
<tr>
<td class="${MAIL_BODY_MARKER}" style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#222222;word-break:break-word;overflow-wrap:break-word;">
${body}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

/**
 * Serializes the Slate document into a complete, mail-client-safe HTML email.
 * Placeholders are emitted as provider tokens (e.g. `*|user_email|*`).
 */
export const serializeToEmailHtml = (
  nodes: Descendant[],
  syntax: PlaceholderSyntax
): string => {
  const body = nodes.map(node => serializeNode(node, syntax)).join('\n');
  return wrapInEmailShell(body);
};

const INLINE_MARK_TAGS: Record<string, TextFormat> = {
  STRONG: TextFormat.Bold,
  B: TextFormat.Bold,
  EM: TextFormat.Italic,
  I: TextFormat.Italic,
  U: TextFormat.Underline,
  DEL: TextFormat.Strikethrough,
  S: TextFormat.Strikethrough,
  STRIKE: TextFormat.Strikethrough,
};

const BLOCK_TAGS: Record<string, BlockFormat> = {
  H1: BlockFormat.H1,
  H2: BlockFormat.H2,
  H3: BlockFormat.H3,
  P: BlockFormat.Paragraph,
  UL: BlockFormat.UnorderedList,
  OL: BlockFormat.OrderedList,
  LI: BlockFormat.ListItem,
};

const deserializeChildren = (
  node: ChildNode,
  marks: Partial<Record<TextFormat, boolean>>
): Descendant[] => {
  const result: Descendant[] = [];
  node.childNodes.forEach(child => {
    result.push(...deserializeNode(child, marks));
  });
  return result;
};

const deserializeNode = (
  node: ChildNode,
  marks: Partial<Record<TextFormat, boolean>>
): Descendant[] => {
  if (node.nodeType === 3) {
    const text = node.textContent ?? '';
    if (!text) {
      return [];
    }
    // Ignore formatting-only whitespace (line breaks / indentation) produced by
    // pretty-printed HTML — it would otherwise become spurious empty paragraphs
    // that compound on every visual <-> HTML round-trip. ` ` (nbsp) is
    // intentional (blank lines) and kept.
    if (!text.includes(' ') && /^\s*$/.test(text) && /[\r\n]/.test(text)) {
      return [];
    }
    return [{ text, ...marks } as Descendant];
  }

  if (node.nodeType !== 1) {
    return [];
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toUpperCase();

  if (tag === 'BR') {
    return [{ text: '\n', ...marks } as Descendant];
  }

  const placeholderKey = element.getAttribute('data-mail-placeholder');
  if (placeholderKey) {
    return [createPlaceholderNode(placeholderKey) as never as Descendant];
  }

  if (tag === 'A') {
    return [
      {
        type: InlineFormat.Link,
        url: element.getAttribute('href') ?? '#',
        children: deserializeChildren(element, marks),
      } as never as Descendant,
    ];
  }

  if (INLINE_MARK_TAGS[tag]) {
    return deserializeChildren(element, {
      ...marks,
      [INLINE_MARK_TAGS[tag]]: true,
    });
  }

  if (BLOCK_TAGS[tag]) {
    const children = deserializeChildren(element, marks);
    return [
      {
        type: BLOCK_TAGS[tag],
        children: children.length ? children : [{ text: '' }],
      } as never as Descendant,
    ];
  }

  // Unknown wrapper: flatten its children.
  return deserializeChildren(element, marks);
};

const isBlockNode = (node: Descendant): boolean => {
  const type = (node as never as { type?: string }).type;
  return (
    type === BlockFormat.Paragraph ||
    type === BlockFormat.H1 ||
    type === BlockFormat.H2 ||
    type === BlockFormat.H3 ||
    type === BlockFormat.UnorderedList ||
    type === BlockFormat.OrderedList
  );
};

/**
 * Parses a (previously exported) mail HTML string back into a Slate document.
 * Provider placeholder tokens are converted back into placeholder chips.
 * Best-effort for templates authored outside this editor.
 */
export const parseEmailHtml = (
  html: string,
  syntax: PlaceholderSyntax
): Descendant[] => {
  if (!html?.trim()) {
    return createEmptyDocument();
  }

  // Turn provider tokens into recognizable spans before DOM parsing.
  const withMarkers = html.replace(
    placeholderTokenRegExp(syntax),
    (_match, key: string) => `<span data-mail-placeholder="${key}"></span>`
  );

  const doc = new DOMParser().parseFromString(withMarkers, 'text/html');
  const bodyContainer = doc.querySelector(`.${MAIL_BODY_MARKER}`) ?? doc.body;

  const nodes = deserializeChildren(bodyContainer, {});

  // Wrap stray inline/text nodes in paragraphs so the document is well-formed.
  const blocks: Descendant[] = [];
  let inlineBuffer: Descendant[] = [];

  const flushInline = () => {
    if (inlineBuffer.length) {
      blocks.push({
        type: BlockFormat.Paragraph,
        children: inlineBuffer,
      } as never as Descendant);
      inlineBuffer = [];
    }
  };

  for (const node of nodes) {
    if (isBlockNode(node)) {
      flushInline();
      blocks.push(node);
    } else {
      inlineBuffer.push(node);
    }
  }
  flushInline();

  return blocks.length ? blocks : createEmptyDocument();
};
