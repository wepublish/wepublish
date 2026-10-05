const WORDS_PER_MINUTE = 200;

type RichTextNode = {
  text?: unknown;
  content?: unknown;
};

const collectText = (node: unknown): string => {
  if (Array.isArray(node)) {
    return node.map(collectText).join(' ');
  }

  if (!node || typeof node !== 'object') {
    return '';
  }

  const { text, content } = node as RichTextNode;

  return [
    typeof text === 'string' ? text : '',
    content ? collectText(content) : '',
  ]
    .filter(Boolean)
    .join(' ');
};

export const countWords = (richText: unknown) =>
  collectText(richText).split(/\s+/).filter(Boolean).length;

export const readingTimeInMinutes = (blocks: readonly unknown[]) => {
  const words = blocks.reduce<number>((total, block) => {
    const richText = (block as { richText?: unknown } | null)?.richText;
    return richText ? total + countWords(richText) : total;
  }, 0);

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};
