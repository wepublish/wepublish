import { EditorBlockType, FullImageFragment } from '@wepublish/editor/api';
import {
  firstParagraphToPlaintext,
  RichtextJSONDocument,
  toPlaintext,
} from '@wepublish/richtext';

import { BlockValue } from './types';

export interface SeoContentStats {
  readonly wordCount: number;
  readonly headingCount: number;
  readonly linkCount: number;
  readonly imageCount: number;
  readonly imagesWithoutDescription: number;
}

export interface SeoBlockContext {
  readonly body: string;
  readonly firstTitle?: string;
  readonly firstParagraph?: string;
  readonly firstImage?: FullImageFragment;
  readonly stats: SeoContentStats;
}

const richTextToPlaintext = (
  richText: RichtextJSONDocument | null | undefined
) =>
  (richText?.content ?? [])
    .map(node => toPlaintext([node])?.trim())
    .filter(Boolean)
    .join('\n');

const blockToPlaintext = (block: BlockValue): string[] => {
  if (block.value?.disabled) {
    return [];
  }

  switch (block.type) {
    case EditorBlockType.Title:
      return [block.value.preTitle, block.value.title, block.value.lead];
    case EditorBlockType.RichText:
      return [richTextToPlaintext(block.value.richText)];
    case EditorBlockType.Quote:
      return [block.value.quote, block.value.author];
    case EditorBlockType.Listicle:
      return block.value.items.flatMap(({ value }) => [
        value.title ?? '',
        richTextToPlaintext(value.richText),
      ]);
    default:
      return [];
  }
};

export const blocksToPlaintext = (blocks: BlockValue[]) =>
  blocks
    .flatMap(blockToPlaintext)
    .map(text => text?.trim())
    .filter(Boolean)
    .join('\n');

type RichtextNode = {
  type?: string;
  content?: RichtextNode[];
  marks?: { type?: string }[];
};

const countNodes = (
  nodes: RichtextNode[] | undefined,
  counter: (node: RichtextNode) => number
): number =>
  (nodes ?? []).reduce(
    (count, node) => count + counter(node) + countNodes(node.content, counter),
    0
  );

const richTexts = (block: BlockValue): RichtextJSONDocument[] => {
  switch (block.type) {
    case EditorBlockType.RichText:
      return block.value.richText ? [block.value.richText] : [];
    case EditorBlockType.Listicle:
      return block.value.items.flatMap(({ value }) =>
        value.richText ? [value.richText] : []
      );
    default:
      return [];
  }
};

const images = (block: BlockValue): FullImageFragment[] => {
  switch (block.type) {
    case EditorBlockType.Image:
      return block.value.image ? [block.value.image] : [];
    case EditorBlockType.ImageGallery:
      return block.value.images.flatMap(({ image }) => (image ? [image] : []));
    case EditorBlockType.Listicle:
      return block.value.items.flatMap(({ value }) =>
        value.image ? [value.image] : []
      );
    default:
      return [];
  }
};

export const getSeoBlockContext = (blocks: BlockValue[]): SeoBlockContext => {
  const enabledBlocks = blocks.filter(block => !block.value?.disabled);
  const body = blocksToPlaintext(enabledBlocks);
  const documents = enabledBlocks.flatMap(richTexts);
  const contentNodes = documents.flatMap(
    document => (document.content ?? []) as RichtextNode[]
  );
  const allImages = enabledBlocks.flatMap(images);

  const firstTitleBlock = enabledBlocks.find(
    block => block.type === EditorBlockType.Title
  );
  const firstRichTextBlock = enabledBlocks.find(
    block => block.type === EditorBlockType.RichText
  );
  const firstImageBlock = enabledBlocks.find(
    block => block.type === EditorBlockType.Image
  );

  return {
    body,
    firstTitle:
      firstTitleBlock?.type === EditorBlockType.Title ?
        firstTitleBlock.value.title || undefined
      : undefined,
    firstParagraph:
      firstRichTextBlock?.type === EditorBlockType.RichText ?
        firstParagraphToPlaintext(
          firstRichTextBlock.value.richText?.content ?? []
        ) || undefined
      : undefined,
    firstImage:
      firstImageBlock?.type === EditorBlockType.Image ?
        (firstImageBlock.value.image ?? undefined)
      : undefined,
    stats: {
      wordCount: body.split(/\s+/).filter(Boolean).length,
      headingCount: countNodes(contentNodes, node =>
        node.type === 'heading' ? 1 : 0
      ),
      linkCount: countNodes(
        contentNodes,
        node => node.marks?.filter(mark => mark.type === 'link').length ?? 0
      ),
      imageCount: allImages.length,
      imagesWithoutDescription: allImages.filter(
        image => !image.description?.trim()
      ).length,
    },
  };
};
