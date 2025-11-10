import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';
import { BlockStylesService } from './block-styles.service';

describe('BlockStylesService', () => {
  let service: BlockStylesService;
  let prismaMock: {
    blockStyle: { [method in keyof PrismaClient['blockStyle']]?: jest.Mock };
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
      blockStyle: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockStylesService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: BlockStylesDataloaderService,
          useValue: {
            prime: jest.fn(),
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
