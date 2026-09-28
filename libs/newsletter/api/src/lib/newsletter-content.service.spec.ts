import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { ImageOutputFormat, MediaAdapter } from '@wepublish/image/api';
import { URLAdapter } from '@wepublish/nest-modules';
import type { NewsletterDocument } from '@wepublish/newsletter';
import { NewsletterContentService } from './newsletter-content.service';

const image = (id: string) => ({
  id,
  focalPointX: 0.5,
  focalPointY: 0.5,
});

const articleRow = (id: string, title: string | null, withImage = true) => ({
  id,
  slug: `slug-${id}`,
  publishedAt: new Date('2026-05-01'),
  hidden: false,
  tags: [{ tag: { tag: 'solar' } }, { tag: { tag: null } }],
  ArticleRevisionPublished: {
    articleRevision: {
      title,
      preTitle: ' Kicker ',
      lead: 'Lead',
      image: withImage ? image(`img-${id}`) : null,
    },
  },
});

describe('NewsletterContentService', () => {
  let service: NewsletterContentService;
  let prisma: {
    article: Record<string, jest.Mock>;
    image: Record<string, jest.Mock>;
  };
  let mediaAdapter: { getImageURL: jest.Mock };

  beforeEach(async () => {
    prisma = {
      article: { findMany: jest.fn() },
      image: { findMany: jest.fn() },
    };
    mediaAdapter = {
      getImageURL: jest.fn(
        (img: { id: string }, t: { width: string; format: string }) =>
          Promise.resolve(`https://media/${img.id}?w=${t.width}&f=${t.format}`)
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        NewsletterContentService,
        { provide: PrismaClient, useValue: prisma },
        { provide: URLAdapter, useValue: new URLAdapter('https://site.test') },
        { provide: MediaAdapter, useValue: mediaAdapter },
      ],
    }).compile();

    service = module.get(NewsletterContentService);
  });

  it('maps published articles with a jpeg teaser image and the public url', async () => {
    prisma.article.findMany.mockResolvedValue([
      articleRow('a1', 'Title'),
      articleRow('a2', null),
    ]);

    const articles = await service.articlesByIds(['a1', 'a2']);

    expect([...articles.keys()]).toEqual(['a1']);
    expect(articles.get('a1')).toMatchObject({
      title: 'Title',
      preTitle: 'Kicker',
      url: 'https://site.test/a/slug-a1',
      imageUrl: 'https://media/img-a1?w=360&f=jpeg',
      tags: ['solar'],
    });
    expect(mediaAdapter.getImageURL).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'img-a1' }),
      { width: '360', format: ImageOutputFormat.Jpeg }
    );
  });

  it('requests each image at the widest column it fills', async () => {
    prisma.image.findMany.mockResolvedValue([image('i1'), image('i2')]);

    const document: NewsletterDocument = {
      preheader: '',
      blocks: [
        { type: 'image', imageId: 'i1', alt: '', gutter: 'none' },
        { type: 'panel', title: 't', paragraphs: [], image: { imageId: 'i1' } },
        { type: 'panel', title: 't', paragraphs: [], image: { imageId: 'i2' } },
      ],
    };

    const images = await service.imagesFor(document);

    expect(images.get('i1')?.url).toBe('https://media/i1?w=1320&f=jpeg');
    expect(images.get('i2')?.url).toBe('https://media/i2?w=360&f=jpeg');
  });

  it('renders the html with resolved teasers and reports what is missing', async () => {
    prisma.article.findMany.mockResolvedValue([articleRow('a1', 'Headline')]);
    prisma.image.findMany.mockResolvedValue([]);

    const { html, report } = await service.render({
      preheader: 'Preview line',
      blocks: [
        { type: 'teaser', variant: 'big', articleId: 'a1' },
        { type: 'teaser', variant: 'short', articleId: 'gone' },
        { type: 'image', imageId: 'nope', alt: '' },
        { type: 'footer', title: 'ee', lines: [] },
      ],
    });

    expect(html).toContain('Headline');
    expect(html).toContain('https://media/img-a1?w=360&amp;f=jpeg');
    expect(html).toContain('*|UNSUB|*');
    expect(html).not.toMatch(/<\/strong\n/);
    expect(report).toMatchObject({
      missingArticles: ['gone'],
      missingImages: ['nope'],
      missingFooter: [],
    });
    expect(report.bytes).toBeGreaterThan(1000);
  });
});
