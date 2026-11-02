import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import { PuckBlocksError } from '@wepublish/puck-content/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { BlockContentInput } from '../block-content.model';
import { BlockType } from '../block-type.model';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import { BlockTemplateService } from './block-template.service';
import type { Mock } from 'vitest';

const templateBlock = (templateId: string): BlockContentInput => ({
  [BlockType.BlockTemplate]: { templateId },
});

const flexBlock = (...blocks: BlockContentInput[]): BlockContentInput => ({
  [BlockType.FlexBlock]: {
    blocks: blocks.map((block, index) => ({
      alignment: { i: `${index}`, x: 0, y: index, w: 12, h: 1 },
      block,
    })),
  },
});

const storedTemplateBlock = (templateId: string) => ({
  type: BlockType.BlockTemplate,
  templateId,
});

const storedFlexBlock = (...blocks: unknown[]) => ({
  type: BlockType.FlexBlock,
  blocks: blocks.map(block => ({ alignment: {}, block })),
});

describe('BlockTemplateService', () => {
  let service: BlockTemplateService;
  let prismaMock: {
    blockTemplate: {
      [method in keyof PrismaClient['blockTemplate']]?: Mock;
    };
    articleTemplate: {
      count: Mock;
    };
    pageTemplate: {
      count: Mock;
    };
  };
  let publicContentCache: {
    invalidate: Mock;
    invalidateArticleLayout: Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      blockTemplate: {
        count: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      articleTemplate: {
        count: vi.fn().mockResolvedValue(0),
      },
      pageTemplate: {
        count: vi.fn().mockResolvedValue(0),
      },
    };
    publicContentCache = {
      invalidate: vi.fn(),
      invalidateArticleLayout: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockTemplateService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: PublicContentCacheInvalidator,
          useValue: publicContentCache,
        },
        {
          provide: BlockTemplateDataloaderService,
          useValue: {
            prime: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlockTemplateService>(BlockTemplateService);
  });

  it('should create a block template', async () => {
    await service.createBlockTemplate({
      name: 'Name',
      blocks: [{ [BlockType.Title]: { title: 'Title' } }],
    });

    expect(prismaMock.blockTemplate.create?.mock.calls[0]).toMatchSnapshot();
  });

  it('should create a block template containing another block template', async () => {
    await service.createBlockTemplate({
      name: 'Name',
      blocks: [templateBlock('other')],
    });

    expect(prismaMock.blockTemplate.findMany).not.toHaveBeenCalled();
    expect(prismaMock.blockTemplate.create?.mock.calls[0]).toMatchSnapshot();
  });

  it('should update a block template', async () => {
    await service.updateBlockTemplate({
      id: '123',
      name: 'Name',
      blocks: [{ [BlockType.Title]: { title: 'Title' } }],
    });

    expect(prismaMock.blockTemplate.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should update a block template containing a non circular block template', async () => {
    prismaMock.blockTemplate.findMany?.mockResolvedValue([
      { blocks: [storedTemplateBlock('other')] },
    ]);

    await service.updateBlockTemplate({
      id: '123',
      name: 'Name',
      blocks: [templateBlock('referenced')],
    });

    expect(prismaMock.blockTemplate.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should reject a block template containing itself', async () => {
    await expect(
      service.updateBlockTemplate({
        id: '123',
        name: 'Name',
        blocks: [templateBlock('123')],
      })
    ).rejects.toThrow('Block templates can not contain circular references.');

    expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
  });

  it('should reject a block template containing itself inside a flex block', async () => {
    await expect(
      service.updateBlockTemplate({
        id: '123',
        name: 'Name',
        blocks: [flexBlock(flexBlock(templateBlock('123')))],
      })
    ).rejects.toThrow('Block templates can not contain circular references.');

    expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
  });

  it('should reject a block template referencing itself transitively', async () => {
    prismaMock.blockTemplate.findMany
      ?.mockResolvedValueOnce([{ blocks: [storedTemplateBlock('nested')] }])
      .mockResolvedValueOnce([
        { blocks: [storedFlexBlock(storedTemplateBlock('123'))] },
      ]);

    await expect(
      service.updateBlockTemplate({
        id: '123',
        name: 'Name',
        blocks: [templateBlock('referenced')],
      })
    ).rejects.toThrow('Block templates can not contain circular references.');

    expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
  });

  it('should not loop on cycles between other block templates', async () => {
    prismaMock.blockTemplate.findMany
      ?.mockResolvedValueOnce([{ blocks: [storedTemplateBlock('other')] }])
      .mockResolvedValueOnce([{ blocks: [storedTemplateBlock('referenced')] }]);

    await service.updateBlockTemplate({
      id: '123',
      name: 'Name',
      blocks: [templateBlock('referenced')],
    });

    expect(prismaMock.blockTemplate.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.blockTemplate.update).toHaveBeenCalled();
  });

  it('should ignore references to missing block templates', async () => {
    prismaMock.blockTemplate.findMany?.mockResolvedValue([]);

    await service.updateBlockTemplate({
      id: '123',
      name: 'Name',
      blocks: [templateBlock('missing')],
    });

    expect(prismaMock.blockTemplate.update).toHaveBeenCalled();
  });

  it('should reject a block template block without a referenced template', async () => {
    await expect(
      service.createBlockTemplate({
        name: 'Name',
        blocks: [templateBlock('')],
      })
    ).rejects.toThrow(
      'Block template blocks without a referenced block template can not be saved.'
    );

    expect(prismaMock.blockTemplate.create).not.toHaveBeenCalled();
  });

  it('should reject a block template block without a referenced template inside a flex block', async () => {
    await expect(
      service.updateBlockTemplate({
        id: '123',
        name: 'Name',
        blocks: [flexBlock(templateBlock(''))],
      })
    ).rejects.toThrow(
      'Block template blocks without a referenced block template can not be saved.'
    );

    expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
  });

  describe('article and page templates', () => {
    it('should not list the content of article or page templates', async () => {
      await service.getBlockTemplates({});

      expect(prismaMock.blockTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AND: [{ articleTemplate: null, pageTemplate: null }] },
        })
      );
    });

    it('should not list the content of article or page templates when filtering by name', async () => {
      await service.getBlockTemplates({ filter: { name: 'Name' } });

      expect(prismaMock.blockTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { articleTemplate: null, pageTemplate: null },
              { name: { mode: 'insensitive', contains: 'Name' } },
            ],
          },
        })
      );
    });

    it('should list only block templates built in the page builder', async () => {
      await service.getBlockTemplates({ filter: { puck: true } });

      expect(prismaMock.blockTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { articleTemplate: null, pageTemplate: null },
              { puckBlocks: { not: Prisma.DbNull } },
            ],
          },
        })
      );
    });

    it('should list only block templates of the block editor', async () => {
      await service.getBlockTemplates({ filter: { puck: false } });

      expect(prismaMock.blockTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { articleTemplate: null, pageTemplate: null },
              { puckBlocks: { equals: Prisma.DbNull } },
            ],
          },
        })
      );
    });

    it('should reject a block template referencing the content of an article or page template', async () => {
      prismaMock.blockTemplate.count?.mockResolvedValue(1);

      await expect(
        service.createBlockTemplate({
          name: 'Name',
          blocks: [flexBlock(templateBlock('template'))],
        })
      ).rejects.toThrow(
        'Article and page templates can not be used as block templates.'
      );

      expect(prismaMock.blockTemplate.count).toHaveBeenCalledWith({
        where: {
          id: { in: ['template'] },
          OR: [
            { articleTemplate: { isNot: null } },
            { pageTemplate: { isNot: null } },
          ],
        },
      });
      expect(prismaMock.blockTemplate.create).not.toHaveBeenCalled();
    });

    it.each(['articleTemplate', 'pageTemplate'] as const)(
      'should not update the content of a %s as block template',
      async owner => {
        prismaMock[owner].count.mockResolvedValue(1);

        await expect(
          service.updateBlockTemplate({ id: '123', name: 'Name', blocks: [] })
        ).rejects.toThrow(
          'Article and page templates can only be changed as article or page templates.'
        );

        expect(prismaMock[owner].count).toHaveBeenCalledWith({
          where: { blockTemplateId: '123' },
        });
        expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
      }
    );

    it.each(['articleTemplate', 'pageTemplate'] as const)(
      'should not delete the content of a %s as block template',
      async owner => {
        prismaMock[owner].count.mockResolvedValue(1);

        await expect(service.deleteBlockTemplate('123')).rejects.toThrow(
          'Article and page templates can only be changed as article or page templates.'
        );

        expect(prismaMock.blockTemplate.delete).not.toHaveBeenCalled();
      }
    );

    it('should not query templates without referenced block templates', async () => {
      await service.mapBlocks([{ [BlockType.Title]: { title: 'Title' } }]);

      expect(prismaMock.blockTemplate.count).not.toHaveBeenCalled();
    });
  });

  it('should delete a block template', async () => {
    await service.deleteBlockTemplate('1234');

    expect(prismaMock.blockTemplate.delete?.mock.calls[0]).toMatchSnapshot();
  });

  it('should retire cached answers and article pages after an update', async () => {
    prismaMock.blockTemplate.update?.mockImplementation(async () => {
      expect(publicContentCache.invalidate).not.toHaveBeenCalled();

      return { id: '1234' };
    });

    await service.updateBlockTemplate({
      id: '1234',
      name: 'Name',
      blocks: [{ [BlockType.Title]: { title: 'Title' } }],
    });

    expect(publicContentCache.invalidate).toHaveBeenCalledWith();
    expect(publicContentCache.invalidateArticleLayout).toHaveBeenCalled();
  });

  it('should retire cached answers and article pages after a delete', async () => {
    prismaMock.blockTemplate.delete?.mockResolvedValue({ id: '1234' });

    await expect(service.deleteBlockTemplate('1234')).resolves.toEqual({
      id: '1234',
    });

    expect(publicContentCache.invalidate).toHaveBeenCalledWith();
    expect(publicContentCache.invalidateArticleLayout).toHaveBeenCalled();
  });

  it('should not retire cached answers when an update is rejected', async () => {
    await expect(
      service.updateBlockTemplate({
        id: '1234',
        name: 'Name',
        blocks: [templateBlock('1234')],
      })
    ).rejects.toThrow();

    expect(publicContentCache.invalidate).not.toHaveBeenCalled();
    expect(publicContentCache.invalidateArticleLayout).not.toHaveBeenCalled();
  });
  describe('puck block templates', () => {
    const heading = {
      id: 'heading-1',
      kind: 'puck',
      type: 'Heading',
      props: {},
    };

    it('should create a block template with puck blocks and no legacy blocks', async () => {
      await service.createBlockTemplate({
        name: 'Name',
        puckBlocks: [heading] as never,
      });

      expect(prismaMock.blockTemplate.create).toHaveBeenCalledWith({
        data: {
          name: 'Name',
          blocks: [],
          puckBlocks: [heading],
          puckRegistry: Prisma.DbNull,
        },
      });
    });

    it('should update the puck blocks of a block template and keep its legacy blocks', async () => {
      prismaMock.blockTemplate.findUnique?.mockResolvedValue({
        puckBlocks: [],
        puckRegistry: null,
      });

      await service.updateBlockTemplate({
        id: '123',
        name: 'Name',
        puckBlocks: [heading] as never,
      });

      expect(prismaMock.blockTemplate.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          name: 'Name',
          puckBlocks: [heading],
          puckRegistry: Prisma.DbNull,
        },
      });
    });
  });

  describe('template content', () => {
    const heading = {
      id: 'heading-1',
      kind: 'puck',
      type: 'Heading',
      props: {},
    };
    const generated = {
      id: 'hero-1',
      kind: 'generated',
      type: 'HeroBanner',
      props: {},
    };
    const registry = {
      components: { HeroBanner: { html: '<section></section>' } },
    };

    it('should map the blocks and the puck document of a new template', async () => {
      await expect(
        service.mapTemplateContent({
          blocks: [{ [BlockType.Title]: { title: 'Title' } }],
          puckBlocks: [heading] as never,
          puckRegistry: null,
        })
      ).resolves.toEqual({
        blocks: [{ type: BlockType.Title, title: 'Title' }],
        puckBlocks: [heading],
        puckRegistry: Prisma.DbNull,
      });

      expect(prismaMock.blockTemplate.findUnique).not.toHaveBeenCalled();
    });

    it('should store a new template without blocks as an empty list and no puck document', async () => {
      await expect(service.mapTemplateContent({})).resolves.toEqual({
        blocks: [],
        puckBlocks: Prisma.DbNull,
        puckRegistry: Prisma.DbNull,
      });
    });

    it('should reject puck blocks naming a generated component the registry lacks', async () => {
      await expect(
        service.mapTemplateContent({ puckBlocks: [generated] as never })
      ).rejects.toThrow(PuckBlocksError);
    });

    it('should keep the stored puck document and blocks of a template when the update omits them', async () => {
      prismaMock.blockTemplate.findUnique?.mockResolvedValue({
        puckBlocks: [generated],
        puckRegistry: registry,
      });

      await expect(service.mapTemplateContent({}, 'template')).resolves.toEqual(
        {
          puckBlocks: [generated],
          puckRegistry: registry,
        }
      );

      expect(prismaMock.blockTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template' },
        select: { puckBlocks: true, puckRegistry: true },
      });
    });

    it('should check given puck blocks of an update against the stored registry', async () => {
      prismaMock.blockTemplate.findUnique?.mockResolvedValue({
        puckBlocks: null,
        puckRegistry: registry,
      });

      await expect(
        service.mapTemplateContent(
          { puckBlocks: [generated] as never },
          'template'
        )
      ).resolves.toEqual({
        puckBlocks: [generated],
        puckRegistry: registry,
      });
    });

    it('should clear the puck document of a template when the update passes null', async () => {
      prismaMock.blockTemplate.findUnique?.mockResolvedValue({
        puckBlocks: [heading],
        puckRegistry: registry,
      });

      await expect(
        service.mapTemplateContent(
          { puckBlocks: null, puckRegistry: null, blocks: [] },
          'template'
        )
      ).resolves.toEqual({
        blocks: [],
        puckBlocks: Prisma.DbNull,
        puckRegistry: Prisma.DbNull,
      });
    });
  });

  describe('linked puck block templates', () => {
    const linked = (id: string, templateId: string) => ({
      id,
      kind: 'puck',
      type: 'LinkedTemplate',
      props: { templateId },
    });
    const container = (...children: unknown[]) => ({
      id: 'container-1',
      kind: 'puck',
      type: 'Container',
      props: { content: [] },
      children: children.map(child => ({
        ...(child as object),
        puckSlot: 'content',
      })),
    });

    it('should reject a block template that links itself', async () => {
      await expect(
        service.updateBlockTemplate({
          id: '123',
          name: 'Name',
          puckBlocks: [container(linked('l1', '123'))] as never,
        })
      ).rejects.toThrow('Block templates can not contain circular references.');

      expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
    });

    it('should reject a block template that links a template linking back to it', async () => {
      prismaMock.blockTemplate.findMany
        ?.mockResolvedValueOnce([
          { blocks: [], puckBlocks: [linked('to-c', 'c')] },
        ])
        .mockResolvedValueOnce([
          { blocks: [], puckBlocks: [container(linked('back', '123'))] },
        ]);

      await expect(
        service.updateBlockTemplate({
          id: '123',
          name: 'Name',
          puckBlocks: [linked('to-b', 'b')] as never,
        })
      ).rejects.toThrow('Block templates can not contain circular references.');

      expect(prismaMock.blockTemplate.update).not.toHaveBeenCalled();
    });

    it('should save a block template linking unrelated templates', async () => {
      prismaMock.blockTemplate.findMany?.mockResolvedValueOnce([
        { blocks: [], puckBlocks: [linked('to-c', 'c')] },
      ]);

      await service.updateBlockTemplate({
        id: '123',
        name: 'Name',
        puckBlocks: [linked('to-b', 'b')] as never,
      });

      expect(prismaMock.blockTemplate.update).toHaveBeenCalled();
    });

    it('should list every template a template links, directly or indirectly', async () => {
      prismaMock.blockTemplate.findMany
        ?.mockResolvedValueOnce([
          {
            blocks: [storedTemplateBlock('legacy')],
            puckBlocks: [linked('to-c', 'c')],
          },
        ])
        .mockResolvedValueOnce([
          { blocks: [], puckBlocks: [container(linked('back', 'b'))] },
        ]);

      await expect(
        service.linkedTemplateIds({
          blocks: [],
          puckBlocks: [container(linked('to-b', 'b'))],
        })
      ).resolves.toEqual(['b', 'legacy', 'c']);
      expect(prismaMock.blockTemplate.findMany).toHaveBeenCalledTimes(2);
    });

    it('should list no linked templates for a template without links', async () => {
      await expect(
        service.linkedTemplateIds({ blocks: [], puckBlocks: null })
      ).resolves.toEqual([]);
      expect(prismaMock.blockTemplate.findMany).not.toHaveBeenCalled();
    });

    it('should not link article or page templates', async () => {
      prismaMock.articleTemplate.count.mockResolvedValue(0);
      prismaMock.blockTemplate.count?.mockResolvedValue(1);

      await expect(
        service.createBlockTemplate({
          name: 'Name',
          puckBlocks: [linked('l1', 'article-template')] as never,
        })
      ).rejects.toThrow(
        'Article and page templates can not be used as block templates.'
      );
    });
  });
});
