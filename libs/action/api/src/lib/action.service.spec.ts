import { Test, TestingModule } from '@nestjs/testing';
import { ActionService } from './action.service';
import { PrismaClient } from '@prisma/client';

describe('ActionService', () => {
  let service: ActionService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      article: {
        findMany: jest.fn(),
      },
      page: {
        findMany: jest.fn(),
      },
      comment: {
        findMany: jest.fn(),
      },
      author: {
        findMany: jest.fn(),
      },
      subscription: {
        findMany: jest.fn(),
      },
      poll: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      event: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);
  });

  it('should get actions', async () => {
    prismaMock.article.findMany.mockResolvedValueOnce([
      { id: '1', createdAt: new Date('2023-01-01T00:00:00Z') },
      { id: '2', createdAt: new Date('2023-01-06T00:00:00Z') },
      { id: '2', createdAt: new Date('2023-01-07T00:00:00Z') },
    ]);
    prismaMock.page.findMany.mockResolvedValueOnce([
      { id: '2', createdAt: new Date('2023-01-02T00:00:00Z') },
    ]);
    prismaMock.comment.findMany.mockResolvedValueOnce([
      { id: '3', createdAt: new Date('2023-01-03T00:00:00Z') },
    ]);
    prismaMock.author.findMany.mockResolvedValueOnce([
      { id: '4', createdAt: new Date('2023-01-02T00:00:00Z') },
      { id: '4', createdAt: new Date('2023-01-04T00:00:00Z') },
    ]);
    prismaMock.subscription.findMany.mockResolvedValueOnce([
      { id: '5', createdAt: new Date('2023-01-03T00:00:00Z') },
    ]);
    prismaMock.poll.findMany.mockResolvedValueOnce([
      { id: '6', opensAt: new Date('2023-01-06T00:00:00Z') },
    ]);
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: '7', createdAt: new Date('2023-01-07T00:00:00Z') },
    ]);
    prismaMock.event.findMany.mockResolvedValueOnce([
      { id: '8', createdAt: new Date('2023-01-08T00:00:00Z') },
    ]);

    const actions = await service.getActions();

    expect(prismaMock.article.findMany).toHaveBeenCalled();
    expect(prismaMock.page.findMany).toHaveBeenCalled();
    expect(prismaMock.comment.findMany).toHaveBeenCalled();
    expect(prismaMock.author.findMany).toHaveBeenCalled();
    expect(prismaMock.subscription.findMany).toHaveBeenCalled();
    expect(prismaMock.poll.findMany).toHaveBeenCalled();
    expect(prismaMock.user.findMany).toHaveBeenCalled();
    expect(prismaMock.event.findMany).toHaveBeenCalled();
    expect(actions).toMatchSnapshot();
  });
});
