import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { Article, PrismaClient, TaggedArticles } from '@prisma/client';
import { ArticleDataloaderService } from './article-dataloader.service';
import { DateFilterComparison, SortOrder } from '@wepublish/utils/api';
import { ArticleSort } from './article.model';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrackingPixelService } from '@wepublish/tracking-pixel/api';
import { mapBlockUnionMap } from '@wepublish/block-content/api';

jest.mock('@wepublish/block-content/api');

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaMock: {
    $queryRaw: jest.Mock;
    articleTrackingPixels: {
      [method in keyof PrismaClient['articleTrackingPixels']]?: jest.Mock;
    };
    article: { [method in keyof PrismaClient['article']]?: jest.Mock };
    articleRevision: {
      [method in keyof PrismaClient['articleRevision']]?: jest.Mock;
    };
    taggedArticles: {
      [method in keyof PrismaClient['taggedArticles']]?: jest.Mock;
    };
  };
  let trackingPixelMock: { [method in keyof TrackingPixelService]?: jest.Mock };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      $queryRaw: jest.fn(),
      article: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      articleRevision: {
        updateMany: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      articleTrackingPixels: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      taggedArticles: {
        findMany: jest.fn(),
      },
    };

    trackingPixelMock = {
      addMissingArticleTrackingPixels: jest.fn(),
      getArticlePixels: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: TrackingPixelService, useValue: trackingPixelMock },
        {
          provide: ArticleDataloaderService,
          useValue: {
            prime: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  it('should query an article by slug', async () => {
    prismaMock.article.findFirst?.mockResolvedValue({});
    await service.getArticleBySlug('1234');

    expect(prismaMock.article.findFirst?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query articles based on filter', async () => {
    prismaMock.article.findMany?.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([{ id: '1234' }, { id: '1235' }]);

    await service.getArticles({
      filter: {
        authors: ['1234'],
        tags: ['1234'],
        excludeIds: ['1234'],
        ids: ['12345'],
        peerId: '1234',
        includeHidden: false,
        preTitle: 'preTitle',
        title: 'title',
        lead: 'lead',
        publicationDateFrom: {
          date: new Date('2025z-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        publicationDateTo: {
          date: new Date('2030-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        shared: true,
        draft: true,
        pending: true,
        published: true,
      },
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.$queryRaw.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query articles based on full text search', async () => {
    prismaMock.article.findMany?.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([{ id: '1234' }, { id: '1235' }]);

    await service.getArticles({
      filter: {
        authors: ['1234'],
        tags: ['1234'],
        excludeIds: ['1234'],
        peerId: '1234',
        includeHidden: false,
        preTitle: 'preTitle',
        title: 'title',
        lead: 'lead',
        body: 'body',
        publicationDateFrom: {
          date: new Date('2025z-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        publicationDateTo: {
          date: new Date('2030-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        shared: true,
        draft: true,
        pending: true,
        published: true,
      },
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.$queryRaw.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query articles on all revisions', async () => {
    prismaMock.article.findMany?.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);

    await service.getArticles({
      filter: {
        authors: ['1234'],
        tags: ['1234'],
        excludeIds: ['1234'],
        ids: ['12345'],
        peerId: '1234',
        includeHidden: false,
        preTitle: 'preTitle',
        title: 'title',
        lead: 'lead',
        body: 'body',
        publicationDateFrom: {
          date: new Date('2025z-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        publicationDateTo: {
          date: new Date('2030-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        shared: true,
      },
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.$queryRaw.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query articles using cursor based pagination', async () => {
    prismaMock.article.findMany?.mockResolvedValue([]);

    await service.getArticles({
      cursorId: '1234',
    });

    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should return paginated articles', async () => {
    prismaMock.article.findMany?.mockResolvedValue([
      { id: '123' },
      { id: '321' },
    ]);
    prismaMock.article.count?.mockResolvedValue(1000);

    const result = await service.getArticles({
      take: 1,
      skip: 5,
    });

    expect(result).toMatchSnapshot();
  });

  it('should create an article', async () => {
    prismaMock.article.create?.mockResolvedValue({
      id: '1234',
    } as Partial<Article>);

    await service.createArticle(
      {
        breaking: false,
        disableComments: false,
        hidden: false,
        hideAuthor: false,
        shared: false,
        properties: [{ id: '123', key: 'key', value: 'value', public: true }],
        socialMediaAuthorIds: ['1234', '12345'],
        tagIds: ['1234', '12345'],
        authorIds: ['1234', '12345'],
        blocks: [
          {
            title: {
              title: 'Title',
              lead: 'Lead',
            },
          },
        ],
      },
      '1234'
    );

    expect(prismaMock.article.create?.mock.calls[0]).toMatchSnapshot();
    expect(
      prismaMock.articleTrackingPixels.createMany?.mock.calls[0]
    ).toMatchSnapshot();
    // make sure mapBlockUnionMap is called
    expect((mapBlockUnionMap as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });

  it('should not create tracking pixels for peer articles', async () => {
    prismaMock.article.create?.mockResolvedValue({
      id: '1234',
      peerId: '1234',
    } as Partial<Article>);

    await service.createArticle(
      {
        breaking: false,
        disableComments: false,
        hidden: false,
        hideAuthor: false,
        shared: false,
        properties: [],
        socialMediaAuthorIds: [],
        tagIds: [],
        authorIds: [],
        blocks: [],
      },
      '1234'
    );

    expect(prismaMock.articleTrackingPixels.createMany).not.toHaveBeenCalled();
  });

  it('should update an article', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '123',
      tags: [
        { tagId: '1', articleId: '123' },
        { tagId: '1234', articleId: '123' },
      ] as Array<Partial<TaggedArticles>>,
    });

    await service.updateArticle(
      {
        id: '123',
        breaking: false,
        disableComments: false,
        hidden: false,
        hideAuthor: false,
        shared: false,
        properties: [{ id: '123', key: 'key', value: 'value', public: true }],
        socialMediaAuthorIds: ['1234', '12345'],
        tagIds: ['1234', '12345'],
        authorIds: ['1234', '12345'],
        blocks: [
          {
            title: {
              title: 'Title',
              lead: 'Lead',
            },
          },
        ],
      },
      '1234'
    );

    expect(prismaMock.article.findUnique?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
    // make sure mapBlockUnionMap is called
    expect((mapBlockUnionMap as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });

  it('should delete an article', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({});
    await service.deleteArticle('1234');

    expect(prismaMock.article.delete?.mock.calls[0]).toMatchSnapshot();
  });

  it('should publish a revision', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: undefined,
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishArticle('1234', new Date('2025-01-01'));
    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should override the original publication date if the original date is in the future', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: new Date('2025-01-01'),
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishArticle('1234', new Date('2026-01-01'));
    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should override the original publication date if older', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: new Date('2023-01-01'),
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishArticle('1234', new Date('2022-01-01'));
    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should not override the original publication date if newer', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: new Date('2022-01-01'),
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishArticle('1234', new Date('2023-01-01'));
    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should unpublish & archive all pending revisions on publish', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishArticle('1234', new Date('2025-01-01'));
    expect(
      prismaMock.articleRevision.updateMany?.mock.calls[0]
    ).toMatchSnapshot();
  });

  it('should unpublish an article', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
    });

    prismaMock.article.update?.mockResolvedValue({
      id: '1234',
      revisions: [
        {
          id: '1234-1234',
        },
        {
          id: '1234-1235',
        },
      ],
    });

    await service.unpublishArticle('1234');

    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.articleRevision.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should like an article', async () => {
    await service.likeArticle('1234');

    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should dislike an article', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      likes: 1,
    });

    await service.dislikeArticle('1234');

    expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should not dislike an article with 0 likes', async () => {
    prismaMock.article.findUnique?.mockResolvedValue({
      id: '1234',
      likes: 0,
    });

    await service.dislikeArticle('1234');

    expect(prismaMock.article.update).not.toHaveBeenCalled();
  });

  describe('version history', () => {
    const buildRevision = (overrides = {}) => ({
      id: 'rev-old',
      articleId: '1234',
      createdAt: new Date('2022-06-01'),
      publishedAt: new Date('2022-06-02'),
      archivedAt: new Date('2022-07-01'),
      userId: 'old-user',
      preTitle: 'Old preTitle',
      title: 'Old title',
      lead: 'Old lead',
      seoTitle: 'Old seo',
      canonicalUrl: 'https://example.com/old',
      hideAuthor: false,
      breaking: true,
      socialMediaTitle: 'Old sm title',
      socialMediaDescription: 'Old sm description',
      imageID: 'image-1',
      socialMediaImageID: 'image-2',
      blocks: [{ title: { title: 'Old', lead: 'Old' } }],
      properties: [{ key: 'key', value: 'value', public: true }],
      authors: [
        { authorId: 'author-1', revisionId: 'rev-old' },
        { authorId: 'author-2', revisionId: 'rev-old' },
      ],
      socialMediaAuthors: [{ authorId: 'sm-author-1', revisionId: 'rev-old' }],
      ...overrides,
    });

    it('should return a paginated, newest-first slice of revisions', async () => {
      prismaMock.articleRevision.count?.mockResolvedValue(3);
      prismaMock.articleRevision.findMany?.mockResolvedValue([
        { id: 'r1' },
        { id: 'r2' },
      ]);

      const result = await service.getArticleRevisions({
        articleId: '1234',
        take: 2,
        skip: 0,
      });

      const findManyArg = prismaMock.articleRevision.findMany?.mock.calls[0][0];
      expect(findManyArg.where).toEqual({ articleId: '1234' });
      expect(findManyArg.orderBy).toEqual({ createdAt: 'desc' });
      expect(result.totalCount).toBe(3);
      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should detect a next page by over-fetching one record', async () => {
      prismaMock.articleRevision.count?.mockResolvedValue(5);
      prismaMock.articleRevision.findMany?.mockResolvedValue([
        { id: 'r1' },
        { id: 'r2' },
        { id: 'r3' },
      ]);

      const result = await service.getArticleRevisions({
        articleId: '1234',
        take: 2,
        skip: 0,
      });

      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.endCursor).toBe('r2');
    });

    it('should filter revisions by user when a filter is given', async () => {
      prismaMock.articleRevision.count?.mockResolvedValue(0);
      prismaMock.articleRevision.findMany?.mockResolvedValue([]);

      await service.getArticleRevisions({
        articleId: '1234',
        filter: { userId: 'user-1' },
        take: 10,
        skip: 0,
      });

      expect(
        prismaMock.articleRevision.findMany?.mock.calls[0][0].where
      ).toEqual({ articleId: '1234', userId: 'user-1' });
    });

    it('should load a single revision by id (for preview)', async () => {
      prismaMock.articleRevision.findUnique?.mockResolvedValue({ id: 'r1' });

      await service.getRevisionById('r1');

      expect(prismaMock.articleRevision.findUnique?.mock.calls[0][0]).toEqual({
        where: { id: 'r1' },
      });
    });

    it('should restore a revision as a new draft', async () => {
      prismaMock.articleRevision.findUnique?.mockResolvedValue(buildRevision());
      prismaMock.article.update?.mockResolvedValue({ id: '1234' });

      await service.restoreArticleRevision('1234', 'rev-old', 'new-user');

      expect(prismaMock.articleRevision.findUnique?.mock.calls[0][0]).toEqual({
        where: { id: 'rev-old' },
        include: { authors: true, socialMediaAuthors: true },
      });
      expect(prismaMock.article.update?.mock.calls[0]).toMatchSnapshot();
    });

    it('should clone content but reset identity/state on the restored draft', async () => {
      prismaMock.articleRevision.findUnique?.mockResolvedValue(buildRevision());
      prismaMock.article.update?.mockResolvedValue({ id: '1234' });

      await service.restoreArticleRevision('1234', 'rev-old', 'new-user');

      const updateArg = prismaMock.article.update?.mock.calls[0][0];
      const created = updateArg.data.revisions.create;

      // identity & state fields of the source revision must not be carried over
      expect(created.id).toBeUndefined();
      expect(created.createdAt).toBeUndefined();
      expect(created.publishedAt).toBeUndefined();
      expect(created.archivedAt).toBeUndefined();
      expect(created.articleId).toBeUndefined();

      // the restoring user becomes the author of the new draft
      expect(created.userId).toBe('new-user');

      // content is cloned verbatim
      expect(created.title).toBe('Old title');
      expect(created.lead).toBe('Old lead');
      expect(created.breaking).toBe(true);
      expect(created.imageID).toBe('image-1');
      expect(created.blocks).toEqual([
        { title: { title: 'Old', lead: 'Old' } },
      ]);
      expect(created.authors.createMany.data).toEqual([
        { authorId: 'author-1' },
        { authorId: 'author-2' },
      ]);
      expect(created.socialMediaAuthors.createMany.data).toEqual([
        { authorId: 'sm-author-1' },
      ]);
    });

    it('should archive the currently open draft before creating the restored one', async () => {
      prismaMock.articleRevision.findUnique?.mockResolvedValue(buildRevision());
      prismaMock.article.update?.mockResolvedValue({ id: '1234' });

      await service.restoreArticleRevision('1234', 'rev-old', 'new-user');

      const updateArg = prismaMock.article.update?.mock.calls[0][0];

      expect(updateArg.where).toEqual({ id: '1234' });
      expect(updateArg.data.revisions.updateMany).toEqual({
        where: { archivedAt: null, publishedAt: null },
        data: { archivedAt: expect.any(Date) },
      });
    });

    it('should throw if the revision does not exist', async () => {
      prismaMock.articleRevision.findUnique?.mockResolvedValue(null);

      await expect(
        service.restoreArticleRevision('1234', 'missing', 'new-user')
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.article.update).not.toHaveBeenCalled();
    });

    it('should throw if the revision belongs to a different article', async () => {
      prismaMock.articleRevision.findUnique?.mockResolvedValue(
        buildRevision({ articleId: 'a-different-article' })
      );

      await expect(
        service.restoreArticleRevision('1234', 'rev-old', 'new-user')
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.article.update).not.toHaveBeenCalled();
    });
  });

  describe('discard draft', () => {
    it('should archive the draft and revert to the published version', async () => {
      prismaMock.article.findUnique?.mockResolvedValue({ id: '1234' });
      prismaMock.articleRevision.findFirst
        ?.mockResolvedValueOnce({ id: 'draft-1', articleId: '1234' }) // draft
        .mockResolvedValueOnce({ id: 'pub-1', articleId: '1234' }); // fallback

      await service.discardArticleDraft('1234');

      expect(prismaMock.articleRevision.update?.mock.calls[0][0]).toEqual({
        where: { id: 'draft-1' },
        data: { archivedAt: expect.any(Date) },
      });
    });

    it('should throw if the article does not exist', async () => {
      prismaMock.article.findUnique?.mockResolvedValue(null);

      await expect(service.discardArticleDraft('1234')).rejects.toThrow(
        NotFoundException
      );
      expect(prismaMock.articleRevision.update).not.toHaveBeenCalled();
    });

    it('should throw if there is no draft to discard', async () => {
      prismaMock.article.findUnique?.mockResolvedValue({ id: '1234' });
      prismaMock.articleRevision.findFirst?.mockResolvedValueOnce(null); // no draft

      await expect(service.discardArticleDraft('1234')).rejects.toThrow(
        BadRequestException
      );
      expect(prismaMock.articleRevision.update).not.toHaveBeenCalled();
    });

    it('should throw if there is no published version to revert to', async () => {
      prismaMock.article.findUnique?.mockResolvedValue({ id: '1234' });
      prismaMock.articleRevision.findFirst
        ?.mockResolvedValueOnce({ id: 'draft-1', articleId: '1234' }) // draft
        .mockResolvedValueOnce(null); // no fallback

      await expect(service.discardArticleDraft('1234')).rejects.toThrow(
        BadRequestException
      );
      expect(prismaMock.articleRevision.update).not.toHaveBeenCalled();
    });
  });

  describe('unhappy path', () => {
    it('updateArticle should throw if article can not be found', async () => {
      await expect(async () => {
        await service.updateArticle(
          {
            id: '1234',
            breaking: false,
            disableComments: false,
            hidden: false,
            hideAuthor: false,
            shared: false,
            properties: [],
            socialMediaAuthorIds: [],
            tagIds: [],
            authorIds: [],
            blocks: [],
          },
          '1234'
        );
      }).rejects.toThrow(NotFoundException);
    });

    it('deleteArticle should throw if article can not be found', async () => {
      await expect(async () => {
        await service.deleteArticle('1234');
      }).rejects.toThrow(NotFoundException);
    });

    it('publishArticle should throw if article can not be found', async () => {
      await expect(async () => {
        await service.publishArticle('1234', new Date());
      }).rejects.toThrow(NotFoundException);
    });

    it('unpublishArticle should throw if article can not be found', async () => {
      await expect(async () => {
        await service.unpublishArticle('1234');
      }).rejects.toThrow(NotFoundException);
    });
  });
});
