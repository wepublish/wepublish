import { Article } from '@wepublish/website/api';
import type { Feed, Item } from 'feed';
import { getArticleSEO } from '@wepublish/article/website';
import { Descendant } from 'slate';
import { isRichTextBlock } from '@wepublish/block-content/website';
import { toHtml } from '@wepublish/richtext';

const escapeXml = (str: string): string => {
  return str.replace(/&/g, '&amp;');
};

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
  async (articles: Article[]) => {
    const items = articles.map(async (article): Promise<Item | null> => {
      const date = article.publishedAt ? new Date(article.publishedAt) : null;
      if (!date || Number.isNaN(date.getTime())) {
        return null;
      }

      const seo = getArticleSEO(article);

      const content = await toHtml(
        article.published?.blocks?.reduce((acc, curr) => {
          if (isRichTextBlock(curr)) {
            acc.push(...curr.richText);
          }

          return acc;
        }, [] as Descendant[]) ?? []
      );

      const authors = article.latest.authors.filter(Boolean).map(author => ({
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
        content: content ? content : (article.latest.lead ?? undefined),
        author: authors.length > 0 ? authors : undefined,
        guid: article.id,
        link: article.url,
        date,
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
      const resolved = await item;
      if (resolved) {
        feed.addItem(resolved);
      }
    }

    for (const category of categories) {
      feed.addCategory(category);
    }

    return feed;
  };
