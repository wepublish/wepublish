import { Article } from '@wepublish/website/api';
import type { Feed, Item } from 'feed';
import { getArticleSEO } from '@wepublish/article/website';
import { isRichTextBlock } from '@wepublish/block-content/website';
import { generateHTML } from '@tiptap/html';
import { RichtextElements, RichtextJSONDocument } from '@wepublish/richtext';

export const toHtml = async (document: RichtextJSONDocument) => {
  const { editorConfig } = await import('@wepublish/richtext/editor');

  return generateHTML(document, editorConfig.extensions ?? []);
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

      const content = await toHtml({
        attrs: undefined,
        type: 'doc',
        content:
          article.published?.blocks?.reduce((acc, curr) => {
            if (isRichTextBlock(curr)) {
              acc.push(...(curr.richText?.content ?? []));
            }

            return acc;
          }, [] as RichtextElements[]) ?? [],
      });

      return {
        title: seo.schema.headline ?? '',
        image: seo.schema.image?.url ?? undefined,
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
