import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BlockTemplateService, BlockType } from '@wepublish/block-content/api';
import { SortOrder } from '@wepublish/utils/api';
import { ArticleTemplateMetadataInput } from '../article.model';
import { ArticleTemplateSort } from './article-template.model';
import { ArticleTemplateService } from './article-template.service';

const metadata: ArticleTemplateMetadataInput = {
  title: 'Title',
  breaking: false,
  hideAuthor: false,
  shared: false,
  hidden: false,
  disableComments: false,
  tagIds: ['tag'],
  authors: [{ authorId: 'author', role: 'Photos' }],
  socialMediaAuthorIds: [],
  properties: [],
};

const blocks = [{ [BlockType.Title]: { title: 'Title' } }];
const mappedBlocks = [{ type: BlockType.Title, title: 'Title' }];

describe('ArticleTemplateService', () => {
  let service: ArticleTemplateService;
  let prismaMock: {
    articleTemplate: Record<
      | 'count'
      | 'findMany'
      | 'findUnique'
      | 'findUniqueOrThrow'
      | 'create'
      | 'update',
      jest.Mock
    >;
    blockTemplate: Record<'delete', jest.Mock>;
  };
  let blockTemplateService: { mapBlocks: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      articleTemplate: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: '1',
          blockTemplateId: 'block-template',
        }),
        create: jest.fn(),
        update: jest.fn(),
      },
      blockTemplate: {
        delete: jest.fn(),
      },
    };
    blockTemplateService = {
      mapBlocks: jest.fn().mockResolvedValue(mappedBlocks),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleTemplateService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: BlockTemplateService, useValue: blockTemplateService },
      ],
    }).compile();

    service = module.get(ArticleTemplateService);
  });

  it('should list article templates sorted by the name of their content', async () => {
    const templates = [{ id: '1' }, { id: '2' }, { id: '3' }];
    prismaMock.articleTemplate.findMany.mockResolvedValue(templates);
    prismaMock.articleTemplate.count.mockResolvedValue(3);

    const result = await service.getArticleTemplates({
      take: 2,
      skip: 0,
      filter: { name: 'News' },
      sort: ArticleTemplateSort.Name,
      order: SortOrder.Descending,
    });

    expect(prismaMock.articleTemplate.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            blockTemplate: { name: { mode: 'insensitive', contains: 'News' } },
          },
        ],
      },
      orderBy: { blockTemplate: { name: 'desc' } },
      skip: 0,
      take: 3,
      cursor: undefined,
    });
    expect(result).toEqual({
      nodes: [{ id: '1' }, { id: '2' }],
      totalCount: 3,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: '1',
        endCursor: '2',
      },
    });
  });

  it('should create an article template with its content as block template', async () => {
    await service.createArticleTemplate({ name: 'Template', blocks, metadata });

    expect(blockTemplateService.mapBlocks).toHaveBeenCalledWith(blocks);
    expect(prismaMock.articleTemplate.create).toHaveBeenCalledWith({
      data: {
        metadata,
        blockTemplate: {
          create: { name: 'Template', blocks: mappedBlocks },
        },
      },
    });
  });

  it('should update an article template and its content', async () => {
    await service.updateArticleTemplate({
      id: '1',
      name: 'Template',
      blocks,
      metadata,
    });

    expect(blockTemplateService.mapBlocks).toHaveBeenCalledWith(
      blocks,
      'block-template'
    );
    expect(prismaMock.articleTemplate.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        metadata,
        blockTemplate: {
          update: { name: 'Template', blocks: mappedBlocks },
        },
      },
    });
  });

  it('should not update an article template with invalid content', async () => {
    blockTemplateService.mapBlocks.mockRejectedValue(new Error('Invalid'));

    await expect(
      service.updateArticleTemplate({
        id: '1',
        name: 'Template',
        blocks,
        metadata,
      })
    ).rejects.toThrow('Invalid');

    expect(prismaMock.articleTemplate.update).not.toHaveBeenCalled();
  });

  it('should delete an article template together with its content', async () => {
    prismaMock.blockTemplate.delete.mockResolvedValue({
      id: 'block-template',
      name: 'Template',
    });

    const deleted = await service.deleteArticleTemplate('1');

    expect(prismaMock.blockTemplate.delete).toHaveBeenCalledWith({
      where: { id: 'block-template' },
    });
    expect(deleted).toEqual({
      id: '1',
      blockTemplateId: 'block-template',
      blockTemplate: { id: 'block-template', name: 'Template' },
    });
  });

  describe('duplicate names', () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`name`)',
      { code: 'P2002', clientVersion: 'test' }
    );

    it('should explain that the name of a new template is taken', async () => {
      prismaMock.articleTemplate.create.mockRejectedValue(
        uniqueConstraintError
      );

      await expect(
        service.createArticleTemplate({ name: 'Template', blocks, metadata })
      ).rejects.toThrow(
        new BadRequestException(
          'A template with the name "Template" already exists.'
        )
      );
    });

    it('should explain that the new name of a template is taken', async () => {
      prismaMock.articleTemplate.update.mockRejectedValue(
        uniqueConstraintError
      );

      await expect(
        service.updateArticleTemplate({
          id: '1',
          name: 'Template',
          blocks,
          metadata,
        })
      ).rejects.toThrow(
        new BadRequestException(
          'A template with the name "Template" already exists.'
        )
      );
    });

    it('should not hide other errors', async () => {
      prismaMock.articleTemplate.create.mockRejectedValue(new Error('Other'));

      await expect(
        service.createArticleTemplate({ name: 'Template', blocks, metadata })
      ).rejects.toThrow('Other');
    });
  });
});
