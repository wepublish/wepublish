import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';
import { BlockStylesService } from './block-styles.service';
import type { Mock } from 'vitest';

describe('BlockStylesService', () => {
  let service: BlockStylesService;
  let prismaMock: {
    blockStyle: { [method in keyof PrismaClient['blockStyle']]?: Mock };
  };

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      blockStyle: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockStylesService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: BlockStylesDataloaderService,
          useValue: {
            prime: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlockStylesService>(BlockStylesService);
  });

  it('should return all block styles', async () => {
    prismaMock.blockStyle.findMany?.mockResolvedValue([
      { id: '123' },
      { id: '321' },
    ]);
    const result = await service.getBlockStyles();

    expect(result).toMatchSnapshot();
  });

  it('should create a block style', async () => {
    await service.createBlockStyle({
      name: 'Name',
      blocks: ['Event'],
    });

    expect(prismaMock.blockStyle.create?.mock.calls[0]).toMatchSnapshot();
  });

  it('should update a block style', async () => {
    prismaMock.blockStyle.findUnique?.mockResolvedValue({
      id: '123',
    });

    await service.updateBlockStyle({
      id: '123',
      name: 'Name',
      blocks: ['Event'],
    });

    expect(prismaMock.blockStyle.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should delete a block style', async () => {
    await service.deleteBlockStyle('1234');

    expect(prismaMock.blockStyle.delete?.mock.calls[0]).toMatchSnapshot();
  });
});
