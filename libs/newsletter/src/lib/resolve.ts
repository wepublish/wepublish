import type { NewsletterBlock, Teaser } from './blocks';
import type { NewsletterDocument } from './document';

/**
 * The article fields a teaser shows. `imageUrl` is expected to be an address
 * a mail client can render, i.e. the media server's JPEG variant.
 */
export interface ArticleSource {
  id: string;
  title: string;
  lead: string | null;
  url: string;
  preTitle: string | null;
  imageUrl: string | null;
}

export interface ImageSource {
  id: string;
  url: string;
}

export function teaserFromArticle(article: ArticleSource): Teaser {
  return {
    kicker: article.preTitle ?? undefined,
    title: article.title,
    lead: article.lead ?? '',
    url: article.url,
    imageUrl: article.imageUrl ?? undefined,
  };
}

export interface ResolvedDocument {
  document: NewsletterDocument;
  /** Article ids the CMS did not return. */
  missingArticles: string[];
  /** Image ids the CMS did not return. */
  missingImages: string[];
}

/**
 * Fills teaser blocks from the CMS and image references from the media
 * server. The only place a headline, lead, link or image URL enters the
 * document, and nothing here is ever stored.
 */
export function resolveDocument(
  document: NewsletterDocument,
  articles: Map<string, ArticleSource>,
  images: Map<string, ImageSource>
): ResolvedDocument {
  const missingArticles: string[] = [];
  const missingImages: string[] = [];

  const imageSrc = (imageId: string | undefined, src: string | undefined) => {
    if (!imageId) {
      return src;
    }

    const image = images.get(imageId);

    if (!image) {
      missingImages.push(imageId);

      return undefined;
    }

    return image.url;
  };

  const blocks = document.blocks.map((block): NewsletterBlock => {
    if (block.type === 'teaser') {
      const article = articles.get(block.articleId);

      if (!article) {
        missingArticles.push(block.articleId);

        return { ...block, teaser: undefined };
      }

      return { ...block, teaser: teaserFromArticle(article) };
    }

    if (block.type === 'image') {
      return { ...block, src: imageSrc(block.imageId, block.src) };
    }

    if (block.type === 'panel' && block.image) {
      return {
        ...block,
        image: {
          ...block.image,
          src: imageSrc(block.image.imageId, block.image.src),
        },
      };
    }

    return block;
  });

  return { document: { ...document, blocks }, missingArticles, missingImages };
}

export function articleIdsIn(document: NewsletterDocument): string[] {
  return [
    ...new Set(
      document.blocks.flatMap(block =>
        block.type === 'teaser' ? [block.articleId] : []
      )
    ),
  ];
}

export function imageIdsIn(document: NewsletterDocument): string[] {
  return [
    ...new Set(
      document.blocks.flatMap(block => {
        if (block.type === 'image' && block.imageId) {
          return [block.imageId];
        }

        if (block.type === 'panel' && block.image?.imageId) {
          return [block.image.imageId];
        }

        return [];
      })
    ),
  ];
}
