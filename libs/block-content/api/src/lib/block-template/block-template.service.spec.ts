import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { BlockContentInput } from '../block-content.model';
import { BlockType } from '../block-type.model';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import { BlockTemplateService } from './block-template.service';

const templateBlock = (templateID: string): BlockContentInput => ({
  [BlockType.BlockTemplate]: { templateID },
});

const flexBlock = (...blocks: BlockContentInput[]): BlockContentInput => ({
  [BlockType.FlexBlock]: {
    blocks: blocks.map((block, index) => ({
      alignment: { i: `${index}`, x: 0, y: index, w: 12, h: 1 },
      block,
    })),
  },
});

const storedTemplateBlock = (templateID: string) => ({
  type: BlockType.BlockTemplate,
  templateID,
});

const storedFlexBlock = (...blocks: unknown[]) => ({
  type: BlockType.FlexBlock,
  blocks: blocks.map(block => ({ alignment: {}, block })),
});

describe('BlockTemplateService', () => {
  let service: BlockTemplateService;
  let prismaMock: {
    blockTemplate: {
      [method in keyof PrismaClient['blockTemplate']]?: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      blockTemplate: {
        count: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockTemplateService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: BlockTemplateDataloaderService,
          useValue: {
            prime: jest.fn(),
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

  it('should delete a block template', async () => {
    await service.deleteBlockTemplate('1234');

    expect(prismaMock.blockTemplate.delete?.mock.calls[0]).toMatchSnapshot();
  });
});
