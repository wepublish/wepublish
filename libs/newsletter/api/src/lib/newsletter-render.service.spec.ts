import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { MediaAdapter } from '@wepublish/image/api';
import { validateImageDimension } from '@wepublish/media-transform-guard';
import { URLAdapter } from '@wepublish/nest-modules';
import type { NewsletterDocument } from '@wepublish/newsletter/email';
import { NewsletterRenderService } from './newsletter-render.service';

const image = (id: string, format: string) => ({ id, format });

const publishedArticle = {
  id: 'article-1',
  slug: 'solar-im-winter',
  ArticleRevisionPublished: {
    articleRevision: {
      title: 'Solar im Winter',
      preTitle: 'SUPSI',
      lead: 'Module für den Alpenraum',
      image: image('photo', 'webp'),
    },
  },
};

const document: NewsletterDocument = {
  preheader: '',
  blocks: [
    { type: 'teaser', variant: 'big', articleId: 'article-1' },
    { type: 'teaser', variant: 'short', articleId: 'unpublished' },
    { type: 'image', imageId: 'logo', alt: 'Logo' },
    { type: 'image', imageId: 'ad', alt: 'Anzeige' },
    { type: 'panel', title: 'Gewusst?', paragraphs: [], imageId: 'cover' },
  ],
};

describe('NewsletterRenderService', () => {
  let service: NewsletterRenderService;
  let prisma: {
    article: { findMany: jest.Mock };
    image: { findMany: jest.Mock };
  };
  let media: { getImageURL: jest.Mock };

  beforeEach(async () => {
    prisma = {
      article: { findMany: jest.fn().mockResolvedValue([publishedArticle]) },
      image: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            image('logo', 'png'),
            image('ad', 'gif'),
            image('cover', 'jpeg'),
          ]),
      },
    };
    media = {
      getImageURL: jest.fn(
        async (img: { id: string }, t: { width: string; format: string }) =>
          `https://media.example.com/${img.id}?width=${t.width}&format=${t.format}`
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        NewsletterRenderService,
        { provide: PrismaClient, useValue: prisma },
        { provide: MediaAdapter, useValue: media },
        {
          provide: URLAdapter,
          useValue: {
            getArticleUrl: async (article: { slug: string }) =>
              `https://example.com/a/${article.slug}`,
          },
        },
      ],
    }).compile();

    service = module.get(NewsletterRenderService);
  });

  it('fills a teaser from the published revision', async () => {
    const { document: resolved } = await service.resolve(document);

    expect(resolved.blocks[0]).toMatchObject({
      teaser: {
        kicker: 'SUPSI',
        title: 'Solar im Winter',
        lead: 'Module für den Alpenraum',
        url: 'https://example.com/a/solar-im-winter',
        imageUrl: 'https://media.example.com/photo?width=500&format=jpeg',
      },
    });
  });

  it('only asks for published articles and reports the rest as missing', async () => {
    const { missing } = await service.resolve(document);

    expect(missing).toEqual(['unpublished']);
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { in: ['article-1', 'unpublished'] },
          publishedAt: { lte: expect.any(Date) },
        },
      })
    );
  });

  it('keeps png and gif and turns everything else into jpeg', async () => {
    const { document: resolved } = await service.resolve(document);

    expect(resolved.blocks.slice(2)).toMatchObject([
      { src: 'https://media.example.com/logo?width=1500&format=png' },
      { src: 'https://media.example.com/ad?width=1500&format=gif' },
      { imageUrl: 'https://media.example.com/cover?width=500&format=jpeg' },
    ]);
  });

  it('only asks for sizes the media server allows', async () => {
    await service.resolve(document);

    for (const [, { width }] of media.getImageURL.mock.calls) {
      expect(() => validateImageDimension(width, undefined)).not.toThrow();
    }
  });

  it('does not query anything for an empty issue', async () => {
    await service.resolve({ preheader: '', blocks: [] });

    expect(prisma.article.findMany).not.toHaveBeenCalled();
    expect(prisma.image.findMany).not.toHaveBeenCalled();
  });

  it('renders the resolved issue', async () => {
    const { html, missing } = await service.render(document);

    expect(html).toContain('Solar im Winter');
    expect(html).toContain(
      'https://media.example.com/logo?width=1500&amp;format=png'
    );
    expect(missing).toEqual(['unpublished']);
  });
});
