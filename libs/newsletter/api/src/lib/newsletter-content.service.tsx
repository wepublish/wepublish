import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ImageOutputFormat, MediaAdapter } from '@wepublish/image/api';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  ArticleSource,
  columnWidth,
  DEFAULT_GUTTER,
  IMAGE_DENSITY,
  imageIdsIn,
  ImageSource,
  articleIdsIn,
  NewsletterDocument,
  newsletterReport,
  NewsletterReport,
  NewsletterShell,
  resolveDocument,
  theme,
} from '@wepublish/newsletter';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewsletterArticle } from './newsletter.model';

const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

const articleInclude = {
  ArticleRevisionPublished: {
    include: { articleRevision: { include: { image: true } } },
  },
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;

type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

export interface RenderedNewsletter {
  html: string;
  report: NewsletterReport;
}

/**
 * Fills a document from the CMS and renders it. A teaser stores an article
 * id and nothing else, so this is the only place a headline, lead, link or
 * image URL enters the newsletter; every render re-reads them.
 *
 * Images are requested as JPEG from the media server: Outlook renders through
 * Word, which has no WebP decoder, so the WebP the CMS serves by default is an
 * empty frame in every Outlook inbox.
 */
@Injectable()
export class NewsletterContentService {
  constructor(
    private prisma: PrismaClient,
    private urlAdapter: URLAdapter,
    private mediaAdapter: MediaAdapter
  ) {}

  private async toArticle(row: ArticleRow): Promise<NewsletterArticle | null> {
    const revision = row.ArticleRevisionPublished?.articleRevision;
    const title = revision?.title?.trim();

    if (!revision || !title) {
      return null;
    }

    const imageUrl =
      revision.image ?
        await this.mediaAdapter.getImageURL(revision.image, {
          width: String(theme.bigTeaser.imageWidth * IMAGE_DENSITY),
          format: ImageOutputFormat.Jpeg,
        })
      : null;

    return {
      id: row.id,
      title,
      preTitle: revision.preTitle?.trim() || null,
      lead: revision.lead?.trim() || null,
      url: await this.urlAdapter.getArticleUrl(row),
      imageUrl,
      publishedAt: row.publishedAt,
      tags: row.tags
        .map(({ tag }) => tag.tag)
        .filter((tag): tag is string => Boolean(tag)),
    };
  }

  /** Published articles of the last `days` days, newest first. */
  async recentArticles(
    days: number,
    take: number
  ): Promise<NewsletterArticle[]> {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.article.findMany({
      where: {
        hidden: false,
        publishedAt: { gte: from },
        ArticleRevisionPublished: { isNot: null },
      },
      orderBy: { publishedAt: 'desc' },
      take,
      include: articleInclude,
    });

    const articles = await Promise.all(rows.map(row => this.toArticle(row)));

    return articles.filter(
      (article): article is NewsletterArticle => article !== null
    );
  }

  /** Ids the CMS does not know are absent, which is how a deleted article shows. */
  async articlesByIds(ids: string[]): Promise<Map<string, NewsletterArticle>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.article.findMany({
      where: { id: { in: ids } },
      include: articleInclude,
    });
    const articles = await Promise.all(rows.map(row => this.toArticle(row)));

    return new Map(
      articles
        .filter((article): article is NewsletterArticle => article !== null)
        .map(article => [article.id, article])
    );
  }

  /**
   * Each image at the widest column the document draws it in, as JPEG. An
   * image block spans the column its gutter leaves; panel images sit in the
   * teaser column.
   */
  private imageWidths(document: NewsletterDocument): Map<string, number> {
    const widest = new Map<string, number>();
    const note = (id: string | undefined, width: number) => {
      if (id) {
        widest.set(id, Math.max(widest.get(id) ?? 0, width));
      }
    };

    for (const block of document.blocks) {
      if (block.type === 'image') {
        note(block.imageId, columnWidth(block.gutter ?? DEFAULT_GUTTER.image));
      } else if (block.type === 'panel') {
        note(block.image?.imageId, theme.bigTeaser.imageWidth);
      }
    }

    return widest;
  }

  async imagesFor(
    document: NewsletterDocument
  ): Promise<Map<string, ImageSource>> {
    const ids = imageIdsIn(document);

    if (ids.length === 0) {
      return new Map();
    }

    const widths = this.imageWidths(document);
    const images = await this.prisma.image.findMany({
      where: { id: { in: ids } },
    });

    return new Map(
      await Promise.all(
        images.map(
          async (image): Promise<[string, ImageSource]> => [
            image.id,
            {
              id: image.id,
              url: await this.mediaAdapter.getImageURL(image, {
                width: String(
                  (widths.get(image.id) ?? theme.contentWidth) * IMAGE_DENSITY
                ),
                format: ImageOutputFormat.Jpeg,
              }),
            },
          ]
        )
      )
    );
  }

  async resolve(document: NewsletterDocument) {
    const [articles, images] = await Promise.all([
      this.articlesByIds(articleIdsIn(document)),
      this.imagesFor(document),
    ]);

    return {
      articles,
      images,
      ...resolveDocument(
        document,
        new Map(
          [...articles].map(([id, article]): [string, ArticleSource] => [
            id,
            article,
          ])
        ),
        images
      ),
    };
  }

  /**
   * Static markup, never pretty-printed: a formatter writes end tags as
   * `</strong\n>`, which iOS Mail and Thunderbird do not recognise, so bold
   * runs bleed through the rest of the block.
   */
  async render(document: NewsletterDocument): Promise<RenderedNewsletter> {
    const resolved = await this.resolve(document);
    const html = `${DOCTYPE}${renderToStaticMarkup(
      <NewsletterShell document={resolved.document} />
    )}`;

    return {
      html,
      report: newsletterReport(
        html,
        resolved.missingArticles,
        resolved.missingImages
      ),
    };
  }
}
