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
    const items = articles.map(async (article): Promise<Item> => {
      const seo = getArticleSEO(article);

      const content = await toHtml(
        article.published?.blocks?.reduce((acc, curr) => {
          if (isRichTextBlock(curr)) {
            acc.push(...curr.richText);
          }

          return acc;
        }, [] as Descendant[]) ?? []
      );

      return {
        title: seo.schema.headline ?? '',
        image:
          seo.schema.image?.url ? escapeXml(seo.schema.image.url) : undefined,
        description: seo.schema.description,
        content: content ? content : (article.latest.lead ?? undefined),
        author: article.latest.authors.map(author => ({
          name: author.name,
          link: author.url,
        })),
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
