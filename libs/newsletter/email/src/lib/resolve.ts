/**
 * Fills teaser blocks from the CMS.
 *
 * A teaser stores an article id and nothing else, so this is the only place a
 * headline, kicker, lead, link or image enters the newsletter. That is what
 * keeps the project's standing rule intact — the issue is written from the
 * wepublish API, never from what the browser posted — and it means the text
 * cannot drift from the article it came from, because no copy of it is kept.
 *
 * Runs on the server before rendering, and in the editor canvas against the
 * article list already loaded there, so both draw the same thing.
 *
 * Images work the same way: an image or panel block stores the id of an image
 * in the media library, and `resolveImages` fills in its URL.
 */
import type { NewsletterBlock, Teaser } from './blocks';
import { theme } from './theme';
import type { NewsletterDocument } from './document';

/** The article fields a teaser shows. Structurally matched by `Article`. */
export interface ArticleSource {
  id: string;
  title: string;
  lead: string | null;
  url: string;
  preTitle: string | null;
  imageUrl: string | null;
}

/**
 * The site's kicker is `preTitle`; everything else maps across directly. The
 * image URL arrives ready to use: the server asks the media server for a format
 * Outlook can read (see `NewsletterRenderService`), the editor canvas for
 * whatever the browser draws.
 */
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
  /** Article ids the CMS did not return — deleted, unpublished, or mistyped. */
  missing: string[];
}

export function resolveTeasers(
  document: NewsletterDocument,
  articles: Map<string, ArticleSource>
): ResolvedDocument {
  const missing: string[] = [];

  const blocks = document.blocks.map((block): NewsletterBlock => {
    if (block.type !== 'teaser') {
      return block;
    }

    const article = articles.get(block.articleId);

    if (!article) {
      missing.push(block.articleId);

      return { ...block, teaser: undefined };
    }

    return { ...block, teaser: teaserFromArticle(article) };
  });

  return { document: { ...document, blocks }, missing };
}

/** Every article a document needs loading, in document order. */
export function articleIdsIn(document: NewsletterDocument): string[] {
  return document.blocks.flatMap(block =>
    block.type === 'teaser' ? [block.articleId] : []
  );
}

/**
 * The width a block draws its image at. A big teaser and a panel put it in a
 * column of `theme.bigTeaser.imageWidth`, an image block spans at most the whole
 * content column.
 */
function renderedWidth(block: NewsletterBlock): number {
  return block.type === 'image' ?
      theme.contentWidth
    : theme.bigTeaser.imageWidth;
}

function imageIdOf(block: NewsletterBlock): string | undefined {
  return block.type === 'image' || block.type === 'panel' ?
      block.imageId
    : undefined;
}

export interface DocumentImage {
  id: string;
  /** The widest the document ever draws it, in CSS pixels. */
  renderedWidth: number;
}

/**
 * Every media-library image the document shows, deduplicated. An image used
 * twice keeps the larger of its widths, so the file asked for is never smaller
 * than the place it renders biggest.
 */
export function imagesIn(document: NewsletterDocument): DocumentImage[] {
  const widest = new Map<string, number>();

  for (const block of document.blocks) {
    const id = imageIdOf(block);

    if (id) {
      widest.set(id, Math.max(widest.get(id) ?? 0, renderedWidth(block)));
    }
  }

  return [...widest].map(([id, width]) => ({ id, renderedWidth: width }));
}

/**
 * Points every image and panel block at the URL of its image. An id the map
 * does not know — the image was deleted from the media library — leaves the
 * block without one, which renders as no image at all.
 */
export function resolveImages(
  document: NewsletterDocument,
  urls: Map<string, string>
): NewsletterDocument {
  const blocks = document.blocks.map((block): NewsletterBlock => {
    if (block.type === 'image' && block.imageId) {
      return { ...block, src: urls.get(block.imageId) };
    }

    if (block.type === 'panel' && block.imageId) {
      return { ...block, imageUrl: urls.get(block.imageId) };
    }

    return block;
  });

  return { ...document, blocks };
}
