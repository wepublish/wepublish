import { strFromU8, strToU8, unzipSync, Zippable, zipSync } from 'fflate';
import {
  extractPlaceholders,
  findPlaceholders,
  placeholderResolver,
} from './template-renderer';

/** A file that cannot be read as a Word document. */
export class DocxTemplateError extends Error {}

const MAIN_PART = 'word/document.xml';

/** The parts of a Word document that carry text a reader sees. */
const TEXT_PART =
  /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;

/**
 * Every zip entry is stamped with this instead of the current time, so the same
 * input always renders to the same bytes and callers can cache by content. The
 * second of January keeps the date inside the zip range in every timezone.
 */
const ZIP_MTIME = new Date('1980-01-02T00:00:00Z');

/**
 * Paragraph boundaries (`<w:p …>`, `<w:p/>`, `</w:p>`) and text nodes
 * (`<w:t …>text</w:t>`, `<w:t/>`). The lookaheads keep `<w:pPr>`, `<w:tab/>`,
 * `<w:tbl>` and friends out. Text never contains `<`: xml escapes it.
 */
const TOKEN_REGEX =
  /<w:p(?=[\s>/])[^>]*>|<\/w:p>|<w:t(?=[\s>/])([^>]*?)(?:\/>|>([^<]*)<\/w:t>)/g;

const XML_SPACE_REGEX = /\sxml:space="[^"]*"/;

interface TextNode {
  /** Where the whole element starts and ends in the part. */
  start: number;
  end: number;
  attributes: string;
  /** The text as it stands in the xml, entities still escaped. */
  text: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The text nodes of a part, grouped by the paragraph they belong to. Word cuts
 * the text of a paragraph into runs wherever formatting, spell checking or the
 * revision id changes, so a placeholder typed in one go can end up spread over
 * several nodes; it never spans paragraphs. A paragraph nested inside another
 * (a text box anchored in it) closes the outer group, so text on either side of
 * the box is never joined.
 */
function paragraphs(xml: string): TextNode[][] {
  const groups: TextNode[][] = [];
  let current: TextNode[] = [];

  for (const match of xml.matchAll(TOKEN_REGEX)) {
    if (match[0].startsWith('<w:t')) {
      current.push({
        start: match.index,
        end: match.index + match[0].length,
        attributes: match[1],
        text: match[2] ?? '',
      });
      continue;
    }

    if (current.length) {
      groups.push(current);
    }

    current = [];
  }

  if (current.length) {
    groups.push(current);
  }

  return groups;
}

function preserveSpaces(attributes: string): string {
  return XML_SPACE_REGEX.test(attributes) ?
      attributes.replace(XML_SPACE_REGEX, ' xml:space="preserve"')
    : `${attributes} xml:space="preserve"`;
}

/**
 * Replace the placeholders of one paragraph. Each value goes into the node its
 * placeholder starts in, taking that node's formatting; the rest of the
 * placeholder is cut out of the nodes it spilled into. Nodes without a
 * placeholder are left exactly as they were.
 */
function renderParagraph(
  nodes: TextNode[],
  resolve: (key: string) => string
): { node: TextNode; xml: string }[] {
  const text = nodes.map(node => node.text).join('');
  const edits = findPlaceholders(text).map(({ index, length, key }) => ({
    start: index,
    end: index + length,
    value: escapeXml(resolve(key)),
  }));

  if (!edits.length) {
    return [];
  }

  const replaced: { node: TextNode; xml: string }[] = [];
  let nodeStart = 0;

  for (const node of nodes) {
    const nodeEnd = nodeStart + node.text.length;
    let output = '';
    let position = nodeStart;
    let touched = false;

    for (const edit of edits) {
      if (edit.end <= nodeStart || edit.start >= nodeEnd) {
        continue;
      }

      touched = true;

      if (edit.start >= nodeStart) {
        output += text.slice(position, edit.start) + edit.value;
      }

      position = Math.min(edit.end, nodeEnd);
    }

    if (touched) {
      output += text.slice(position, nodeEnd);
      replaced.push({
        node,
        // The value may start or end with a space, which Word drops from a
        // node that does not ask to keep them.
        xml: `<w:t${preserveSpaces(node.attributes)}>${output}</w:t>`,
      });
    }

    nodeStart = nodeEnd;
  }

  return replaced;
}

function renderPart(xml: string, resolve: (key: string) => string): string {
  const replaced = paragraphs(xml).flatMap(nodes =>
    renderParagraph(nodes, resolve)
  );

  let output = '';
  let position = 0;

  for (const { node, xml: replacement } of replaced) {
    output += xml.slice(position, node.start) + replacement;
    position = node.end;
  }

  return output + xml.slice(position);
}

function readDocx(docx: Uint8Array): Record<string, Uint8Array> {
  let files: Record<string, Uint8Array>;

  try {
    files = unzipSync(docx);
  } catch (error) {
    throw new DocxTemplateError(
      `Not a Word document (.docx): ${(error as Error).message}`
    );
  }

  if (!files[MAIN_PART]) {
    throw new DocxTemplateError(
      `Not a Word document (.docx): ${MAIN_PART} is missing`
    );
  }

  return files;
}

/**
 * Fill a Word document (.docx) in with the same `{{ key }}` placeholders and
 * lookup a mail template uses, in the body, headers, footers and notes. `data`
 * is the enriched placeholder map, as for `renderTemplate`. Values are inserted
 * as plain text. Every other part of the file is kept as it was.
 */
export function renderDocxTemplate(
  docx: Uint8Array,
  data: Record<string, unknown>
): Uint8Array {
  const resolve = placeholderResolver(data);
  const files: Zippable = {};

  for (const [name, content] of Object.entries(readDocx(docx))) {
    files[name] =
      TEXT_PART.test(name) ?
        strToU8(renderPart(strFromU8(content), resolve))
      : content;
  }

  return zipSync(files, { mtime: ZIP_MTIME });
}

/** The distinct `{{ key }}` placeholders a Word document uses. */
export function extractDocxPlaceholders(docx: Uint8Array): string[] {
  const text = Object.entries(readDocx(docx))
    .filter(([name]) => TEXT_PART.test(name))
    .flatMap(([, content]) =>
      paragraphs(strFromU8(content)).map(nodes =>
        nodes.map(node => node.text).join('')
      )
    )
    .join('\n');

  return extractPlaceholders(text);
}
