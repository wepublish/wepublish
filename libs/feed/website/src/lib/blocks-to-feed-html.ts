import { generateHTML } from '@tiptap/html';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { FeedArticleFragment, FeedImageFragment } from '@wepublish/website/api';

export type FeedBlock = FeedArticleFragment['latest']['blocks'][number];
type FeedFlexBlock = Extract<FeedBlock, { __typename: 'FlexBlock' }>;
type NestedFeedBlock = FeedFlexBlock['blocks'][number]['block'];
type AnyFeedBlock = FeedBlock | NonNullable<NestedFeedBlock>;

export const toHtml = async (document: RichtextJSONDocument) => {
  const { editorConfig } = await import('@wepublish/richtext/editor/config');

  return generateHTML(document, editorConfig.extensions ?? []);
};

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, char => HTML_ENTITIES[char] ?? char);

const titleHtml = ({
  title,
  lead,
}: {
  title: string | null;
  lead: string | null;
}) =>
  [
    title && `<h2>${escapeHtml(title)}</h2>`,
    lead && `<p>${escapeHtml(lead)}</p>`,
  ]
    .filter(Boolean)
    .join('');

const quoteHtml = ({
  quote,
  author,
}: {
  quote: string | null;
  author: string | null;
}) => {
  if (!quote) {
    return '';
  }

  const cite = author ? `<cite>${escapeHtml(author)}</cite>` : '';

  return `<blockquote><p>${escapeHtml(quote)}</p>${cite}</blockquote>`;
};

const imageHtml = ({
  caption,
  image,
}: {
  caption: string | null;
  image: FeedImageFragment | null;
}) => {
  const src = image?.m ?? image?.url;
  const alt = image?.description ?? image?.title ?? '';
  const img =
    src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">` : '';
  const figcaption =
    caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';

  return img || figcaption ? `<figure>${img}${figcaption}</figure>` : '';
};

const readingOrder = (flex: FeedFlexBlock) =>
  [...flex.blocks]
    .sort(
      (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
    )
    .map(({ block }) => block);

const blockHtml = async (block: AnyFeedBlock): Promise<string> => {
  switch (block.__typename) {
    case 'RichTextBlock':
      return block.richText ? toHtml(block.richText) : '';
    case 'TitleBlock':
      return titleHtml(block);
    case 'QuoteBlock':
      return quoteHtml(block);
    case 'ImageBlock':
      return imageHtml(block);
    case 'FlexBlock':
      return 'blocks' in block ? blocksToFeedHtml(readingOrder(block)) : '';
    default:
      return '';
  }
};

const isPresent = <T>(block: T | null): block is T => block !== null;

export const blocksToFeedHtml = async (
  blocks: ReadonlyArray<AnyFeedBlock | null>
): Promise<string> =>
  (await Promise.all(blocks.filter(isPresent).map(blockHtml))).join('');
