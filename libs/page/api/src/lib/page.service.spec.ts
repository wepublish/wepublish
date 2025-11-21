import { Test, TestingModule } from '@nestjs/testing';
import { PageService } from './page.service';
import { Page, PrismaClient, TaggedPages } from '@prisma/client';
import { PageDataloaderService } from './page-dataloader.service';
import { DateFilterComparison, SortOrder } from '@wepublish/utils/api';
import { PageSort } from './page.model';
import { NotFoundException } from '@nestjs/common';
import { mapBlockUnionMap } from '@wepublish/block-content/api';

jest.mock('@wepublish/block-content/api');

describe('PageService', () => {
  let service: PageService;
  let prismaMock: {
    $queryRaw: jest.Mock;
    page: { [method in keyof PrismaClient['page']]?: jest.Mock };
    pageRevision: {
      [method in keyof PrismaClient['pageRevision']]?: jest.Mock;
    };
  };

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
      page: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      pageRevision: {
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: PageDataloaderService,
          useValue: {
            prime: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PageService>(PageService);
  });

  it('should query an page by slug', async () => {
    prismaMock.page.findFirst?.mockResolvedValue({});
    await service.getPageBySlug('1234');

    expect(prismaMock.page.findFirst?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query pages based on filter', async () => {
    prismaMock.page.findMany?.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([{ id: '1234' }, { id: '1235' }]);

    await service.getPages({
      filter: {
        tags: ['1234'],
        includeHidden: false,
        title: 'title',
        description: 'description',
        publicationDateFrom: {
          date: new Date('2025z-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        publicationDateTo: {
          date: new Date('2030-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        draft: true,
        pending: true,
        published: true,
      },
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.$queryRaw.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.page.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.page.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query pages on all revisions', async () => {
    prismaMock.page.findMany?.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);

    await service.getPages({
      filter: {
        tags: ['1234'],
        includeHidden: false,
        title: 'title',
        description: 'description',
        publicationDateFrom: {
          date: new Date('2025z-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
        publicationDateTo: {
          date: new Date('2030-01-01'),
          comparison: DateFilterComparison.LowerThan,
        },
      },
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.$queryRaw.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.page.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.page.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query pages using cursor based pagination', async () => {
    prismaMock.page.findMany?.mockResolvedValue([]);

    await service.getPages({
      cursorId: '1234',
    });

    expect(prismaMock.page.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.page.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should return paginated pages', async () => {
    prismaMock.page.findMany?.mockResolvedValue([{ id: '123' }, { id: '321' }]);
    prismaMock.page.count?.mockResolvedValue(1000);

    const result = await service.getPages({
      take: 1,
      skip: 5,
    });

    expect(result).toMatchSnapshot();
  });

  it('should create an page', async () => {
    prismaMock.page.create?.mockResolvedValue({
      id: '1234',
    } as Partial<Page>);

    await service.createPage(
      {
        hidden: false,
        properties: [{ id: '123', key: 'key', value: 'value', public: true }],
        tagIds: ['1234', '12345'],
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

    expect(prismaMock.page.create?.mock.calls[0]).toMatchSnapshot();
    // make sure mapBlockUnionMap is called
    expect((mapBlockUnionMap as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });

  it('should update an page', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '123',
      tags: [
        { tagId: '1', pageId: '123' },
        { tagId: '1234', pageId: '123' },
      ] as Array<Partial<TaggedPages>>,
    });

    await service.updatePage(
      {
        id: '123',
        hidden: false,
        properties: [{ id: '123', key: 'key', value: 'value', public: true }],
        tagIds: ['1234', '12345'],
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

    expect(prismaMock.page.findUnique?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.page.update?.mock.calls[0]).toMatchSnapshot();
    // make sure mapBlockUnionMap is called
    expect((mapBlockUnionMap as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });

  it('should delete an page', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({});
    await service.deletePage('1234');

    expect(prismaMock.page.delete?.mock.calls[0]).toMatchSnapshot();
  });

  it('should publish a revision', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: undefined,
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishPage('1234', new Date('2025-01-01'));
    expect(prismaMock.page.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should override the original publication date if the original date is in the future', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: new Date('2025-01-01'),
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishPage('1234', new Date('2026-01-01'));
    expect(prismaMock.page.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should override the original publication date if older', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: new Date('2023-01-01'),
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishPage('1234', new Date('2022-01-01'));
    expect(prismaMock.page.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should not override the original publication date if newer', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '1234',
      publishedAt: new Date('2022-01-01'),
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishPage('1234', new Date('2023-01-01'));
    expect(prismaMock.page.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should unpublish & archive all pending revisions on publish', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '1234',
      revisions: [
        {
          id: '1234-1234',
        },
      ],
    });

    await service.publishPage('1234', new Date('2025-01-01'));
    expect(prismaMock.pageRevision.updateMany?.mock.calls[0]).toMatchSnapshot();
  });

  it('should unpublish an page', async () => {
    prismaMock.page.findUnique?.mockResolvedValue({
      id: '1234',
    });

    prismaMock.page.update?.mockResolvedValue({
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

    await service.unpublishPage('1234');

    expect(prismaMock.page.update?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.pageRevision.update?.mock.calls[0]).toMatchSnapshot();
  });

  describe('unhappy path', () => {
    it('updatePage should throw if page can not be found', async () => {
      await expect(async () => {
        await service.updatePage(
          {
            id: '1234',
            hidden: false,
            properties: [],
            tagIds: [],
            blocks: [],
          },
          '1234'
        );
      }).rejects.toThrow(NotFoundException);
    });

    it('deletePage should throw if page can not be found', async () => {
      await expect(async () => {
        await service.deletePage('1234');
      }).rejects.toThrow(NotFoundException);
    });

    it('publishPage should throw if page can not be found', async () => {
      await expect(async () => {
        await service.publishPage('1234', new Date());
      }).rejects.toThrow(NotFoundException);
    });

    it('unpublishPage should throw if page can not be found', async () => {
      await expect(async () => {
        await service.unpublishPage('1234');
      }).rejects.toThrow(NotFoundException);
    });
  });
});
