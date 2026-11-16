import { getArticleSEO } from '@wepublish/article/website';
import { FeedArticleFragment } from '@wepublish/website/api';
import type { Feed, Item } from 'feed';

import { blocksToFeedHtml } from './blocks-to-feed-html';

export { toHtml } from './blocks-to-feed-html';

export const FEED_PAYWALLED_CONTENT = ['lead', 'visible', 'full'] as const;

export type FeedPaywalledContent = (typeof FEED_PAYWALLED_CONTENT)[number];

export const FEED_PAYWALLED_CONTENT_SETTING = 'feedPaywalledContent';

export const toFeedPaywalledContent = (value: unknown): FeedPaywalledContent =>
  FEED_PAYWALLED_CONTENT.find(choice => choice === value) ?? 'lead';

export type FeedOptions = {
  paywalledContent?: FeedPaywalledContent;
};

const escapeXml = (str: string): string => {
  return str.replace(/&/g, '&amp;');
};

const publishedBlocks = (
  article: FeedArticleFragment,
  paywalledContent: FeedPaywalledContent
) => {
  if (article.peerId) {
    return [];
  }

  if (!article.paywall?.active || paywalledContent === 'full') {
    return article.latest.blocks;
  }

  if (paywalledContent === 'visible') {
    return article.latest.blocks.slice(0, article.paywall.hideContentAfter);
  }

  return [];
};

const itemContent = async (
  article: FeedArticleFragment,
  paywalledContent: FeedPaywalledContent
) =>
  (await blocksToFeedHtml(publishedBlocks(article, paywalledContent))) ||
  (article.latest.lead ?? undefined);

export const generateFeed =
  ({
    categories = [],
    ...config
  }: Omit<
    ConstructorParameters<typeof Feed>[0] & {
      categories?: string[];
    },
    'generator'
  >) =>
  async (
    articles: FeedArticleFragment[],
    { paywalledContent = 'lead' }: FeedOptions = {}
  ) => {
    const items = articles.map(async (article): Promise<Item> => {
      const seo = getArticleSEO(article);
      const content = await itemContent(article, paywalledContent);

      const authors = article.latest.authors.map(({ author }) => ({
        name: author.name,
        link: author.url,
      }));

      return {
        title: seo.schema.headline ?? '',
        image:
          seo.schema.image ?
            {
              url: escapeXml(seo.schema.image.url),
              type: 'image/webp',
            }
          : undefined,
        description: seo.schema.description,
        content,
        author: authors.length ? authors : undefined,
        guid: article.id,
        link: article.url,
        date: new Date(article.publishedAt!),
        category: article.tags.map(tag => ({
          name: tag.tag ?? undefined,
          term: tag.tag ?? undefined,
        })),
      };
    });

    const Feed = (await import('feed')).Feed;
    const feed = new Feed({
      language: 'de',
      description: '',
      ...config,
      generator: 'We.Publish (https://github.com/wepublish/wepublish)',
    });

    for (const item of items) {
      feed.addItem(await item);
    }

    for (const category of categories) {
      feed.addCategory(category);
    }

    return feed;
  };
