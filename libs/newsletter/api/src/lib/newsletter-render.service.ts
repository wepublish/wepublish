import { Injectable } from '@nestjs/common';
import { Image, PrismaClient } from '@prisma/client';
import { MediaAdapter } from '@wepublish/image/api';
import type { OutputFormat } from '@wepublish/media-transform-guard';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  ArticleSource,
  articleIdsIn,
  imagesIn,
  NewsletterDocument,
  resolveImages,
  resolveTeasers,
  theme,
} from '@wepublish/newsletter/email';
import { renderNewsletter } from '@wepublish/newsletter/email/render';

/**
 * Widths the media server allows (`validateImageDimension`), ascending. An image
 * is asked for at the first one at least twice as wide as it is drawn, so it
 * stays sharp on a high-density screen and Outlook scales down rather than up.
 */
const IMAGE_WIDTHS = [500, 1500];

const imageWidth = (renderedWidth: number) =>
  IMAGE_WIDTHS.find(width => width >= renderedWidth * 2) ??
  IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];

/**
 * Outlook on Windows renders through Word, which cannot decode the WebP the
 * media server serves by default: every image would be an empty frame. PNG and
 * GIF are kept so a transparent logo stays transparent and an animated advert
 * stays animated; everything else becomes JPEG.
 */
const imageFormat = (image: Image): OutputFormat =>
  image.format === 'png' || image.format === 'gif' ? image.format : 'jpeg';

@Injectable()
export class NewsletterRenderService {
  constructor(
    private prisma: PrismaClient,
    private media: MediaAdapter,
    private urls: URLAdapter
  ) {}

  private imageURL(image: Image, renderedWidth: number) {
    return this.media.getImageURL(image, {
      width: String(imageWidth(renderedWidth)),
      format: imageFormat(image),
    });
  }

  /**
   * The published revision only, as on the website: a teaser for a draft would
   * link readers to a page that does not exist yet.
   */
  private async loadArticles(ids: string[]) {
    const found = new Map<string, ArticleSource>();

    if (!ids.length) {
      return found;
    }

    const articles = await this.prisma.article.findMany({
      where: {
        id: { in: [...new Set(ids)] },
        publishedAt: { lte: new Date() },
      },
      include: {
        ArticleRevisionPublished: {
          include: { articleRevision: { include: { image: true } } },
        },
      },
    });

    for (const article of articles) {
      const revision = article.ArticleRevisionPublished?.articleRevision;
      const title = revision?.title?.trim();

      if (!revision || !title) {
        continue;
      }

      found.set(article.id, {
        id: article.id,
        title,
        preTitle: revision.preTitle?.trim() || null,
        lead: revision.lead?.trim() || null,
        url: await this.urls.getArticleUrl(article),
        imageUrl:
          revision.image ?
            await this.imageURL(revision.image, theme.bigTeaser.imageWidth)
          : null,
      });
    }

    return found;
  }

  private async loadImages(document: NewsletterDocument) {
    const wanted = imagesIn(document);
    const urls = new Map<string, string>();

    if (!wanted.length) {
      return urls;
    }

    const images = await this.prisma.image.findMany({
      where: { id: { in: wanted.map(({ id }) => id) } },
    });

    for (const { id, renderedWidth } of wanted) {
      const image = images.find(candidate => candidate.id === id);

      if (image) {
        urls.set(id, await this.imageURL(image, renderedWidth));
      }
    }

    return urls;
  }

  /**
   * Fills every teaser and image from the database. One query for the articles
   * and one for the images, not one per block — a full issue has around forty
   * teasers.
   */
  async resolve(document: NewsletterDocument) {
    const [articles, images] = await Promise.all([
      this.loadArticles(articleIdsIn(document)),
      this.loadImages(document),
    ]);
    const resolved = resolveTeasers(document, articles);

    return {
      document: resolveImages(resolved.document, images),
      missing: resolved.missing,
    };
  }

  async render(document: NewsletterDocument) {
    const resolved = await this.resolve(document);

    return {
      html: await renderNewsletter(resolved.document),
      document: resolved.document,
      missing: resolved.missing,
    };
  }
}
