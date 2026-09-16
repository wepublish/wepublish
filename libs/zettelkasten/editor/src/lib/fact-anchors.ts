import type { RichtextJSONDocument } from '@wepublish/richtext';

const STOP_WORDS = new Set([
  'Der',
  'Die',
  'Das',
  'Ein',
  'Eine',
  'Und',
  'Im',
  'In',
  'Am',
  'Auf',
  'Mit',
  'Für',
  'Von',
  'Zu',
  'Nach',
  'Bei',
]);

// A word that starts with an upper-case letter (Latin, incl. umlauts) and has
// at least two characters.
const CAPITALISED = /^[A-ZÄÖÜÉÈÀ][\p{L}-]+$/u;

/**
 * Deterministic candidates for the knowledge base: two consecutive capitalised
 * words, in order of appearance, without duplicates. No model is involved; the
 * lookup against the knowledge base decides what a candidate is.
 */
export function extractFactAnchors(texts: string[]): string[] {
  const seen = new Set<string>();
  const anchors: string[] = [];

  for (const text of texts) {
    for (const sentence of text.split(/[.!?:;\n]+/)) {
      const words = sentence.split(/\s+/).filter(Boolean);

      for (let i = 0; i + 1 < words.length; i++) {
        const [first, second] = [words[i], words[i + 1]].map(word =>
          word.replace(/^[«"(]+|[»",)]+$/g, '')
        );

        if (
          !CAPITALISED.test(first) ||
          !CAPITALISED.test(second) ||
          STOP_WORDS.has(first)
        ) {
          continue;
        }

        const anchor = `${first} ${second}`;

        if (!seen.has(anchor)) {
          seen.add(anchor);
          anchors.push(anchor);
        }
      }
    }
  }

  return anchors;
}

type Node = { type?: string; text?: string; content?: Node[] };

/** The plain text of a tiptap document, text nodes joined with a space. */
export function richtextToText(
  doc: RichtextJSONDocument | null | undefined
): string {
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.text) {
      parts.push(node.text);
    }
    node.content?.forEach(walk);
  };

  if (doc) {
    walk(doc as Node);
  }

  return parts.join(' ');
}
