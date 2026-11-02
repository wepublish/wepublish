import type { Mock } from 'vitest';

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BlockTemplateService, BlockType } from '@wepublish/block-content/api';
import { SortOrder } from '@wepublish/utils/api';
import { PageTemplateMetadataInput } from '../page.model';
import { PageTemplateSort } from './page-template.model';
import { PageTemplateService } from './page-template.service';

const metadata: PageTemplateMetadataInput = {
  title: 'Title',
  description: 'Description',
  hidden: false,
  tagIds: ['tag'],
  properties: [],
};

const blocks = [{ [BlockType.Title]: { title: 'Title' } }];
const mappedBlocks = [{ type: BlockType.Title, title: 'Title' }];

describe('PageTemplateService', () => {
  let service: PageTemplateService;
  let prismaMock: {
    pageTemplate: Record<
      | 'count'
      | 'findMany'
      | 'findUnique'
      | 'findUniqueOrThrow'
      | 'create'
      | 'update',
      Mock
    >;
    blockTemplate: Record<'delete', Mock>;
  };
  let blockTemplateService: { mapBlocks: Mock };

  beforeEach(async () => {
    prismaMock = {
      pageTemplate: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: '1',
          blockTemplateId: 'block-template',
        }),
        create: vi.fn(),
        update: vi.fn(),
      },
      blockTemplate: {
        delete: vi.fn(),
      },
    };
    blockTemplateService = {
      mapBlocks: vi.fn().mockResolvedValue(mappedBlocks),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageTemplateService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: BlockTemplateService, useValue: blockTemplateService },
      ],
    }).compile();

    service = module.get(PageTemplateService);
  });

  it('should list page templates sorted by the name of their content', async () => {
    const templates = [{ id: '1' }, { id: '2' }, { id: '3' }];
    prismaMock.pageTemplate.findMany.mockResolvedValue(templates);
    prismaMock.pageTemplate.count.mockResolvedValue(3);

    const result = await service.getPageTemplates({
      take: 2,
      skip: 0,
      filter: { name: 'News' },
      sort: PageTemplateSort.Name,
      order: SortOrder.Descending,
    });

    expect(prismaMock.pageTemplate.findMany).toHaveBeenCalledWith({
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

  it('should create a page template with its content as block template', async () => {
    await service.createPageTemplate({ name: 'Template', blocks, metadata });

    expect(blockTemplateService.mapBlocks).toHaveBeenCalledWith(blocks);
    expect(prismaMock.pageTemplate.create).toHaveBeenCalledWith({
      data: {
        metadata,
        blockTemplate: {
          create: { name: 'Template', blocks: mappedBlocks },
        },
      },
    });
  });

  it('should update a page template and its content', async () => {
    await service.updatePageTemplate({
      id: '1',
      name: 'Template',
      blocks,
      metadata,
    });

    expect(blockTemplateService.mapBlocks).toHaveBeenCalledWith(
      blocks,
      'block-template'
    );
    expect(prismaMock.pageTemplate.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        metadata,
        blockTemplate: {
          update: { name: 'Template', blocks: mappedBlocks },
        },
      },
    });
  });

  it('should not update a page template with invalid content', async () => {
    blockTemplateService.mapBlocks.mockRejectedValue(new Error('Invalid'));

    await expect(
      service.updatePageTemplate({
        id: '1',
        name: 'Template',
        blocks,
        metadata,
      })
    ).rejects.toThrow('Invalid');

    expect(prismaMock.pageTemplate.update).not.toHaveBeenCalled();
  });

  it('should delete a page template together with its content', async () => {
    prismaMock.blockTemplate.delete.mockResolvedValue({
      id: 'block-template',
      name: 'Template',
    });

    const deleted = await service.deletePageTemplate('1');

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
      prismaMock.pageTemplate.create.mockRejectedValue(uniqueConstraintError);

      await expect(
        service.createPageTemplate({ name: 'Template', blocks, metadata })
      ).rejects.toThrow(
        new BadRequestException(
          'A template with the name "Template" already exists.'
        )
      );
    });

    it('should explain that the new name of a template is taken', async () => {
      prismaMock.pageTemplate.update.mockRejectedValue(uniqueConstraintError);

      await expect(
        service.updatePageTemplate({
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
      prismaMock.pageTemplate.create.mockRejectedValue(new Error('Other'));

      await expect(
        service.createPageTemplate({ name: 'Template', blocks, metadata })
      ).rejects.toThrow('Other');
    });
  });
});
