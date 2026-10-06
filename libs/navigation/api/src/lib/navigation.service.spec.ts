import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NavigationService } from './navigation.service';
import { NavigationDataloaderService } from './navigation-dataloader.service';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';

describe('NavigationService', () => {
  let service: NavigationService;
  let navigationDataloaderService: {
    [method in keyof NavigationDataloaderService]?: jest.Mock;
  };
  let prismaMock: any;

  beforeEach(async () => {
    navigationDataloaderService = {
      load: jest.fn(),
      prime: jest.fn(),
    };

    prismaMock = {
      navigation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      navigationLink: {
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [
        NavigationService,
        {
          provide: NavigationDataloaderService,
          useValue: navigationDataloaderService,
        },
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NavigationService>(NavigationService);
  });

  it('should get all navigations', async () => {
    prismaMock.navigation.findMany.mockResolvedValueOnce([]);
    await service.getNavigations();
    expect(prismaMock.navigation.findMany).toHaveBeenCalled();
    expect(prismaMock.navigation.findMany.mock.calls[0]).toMatchSnapshot();
  });

  it('should create a navigation', async () => {
    const input = { key: 'testKey', name: 'testName', links: [] };
    prismaMock.navigation.create.mockResolvedValueOnce({});
    await service.createNavigation(input);
    expect(prismaMock.navigation.create).toHaveBeenCalled();
    expect(prismaMock.navigation.create.mock.calls[0]).toMatchSnapshot();
  });

  it('should delete a navigation by id', async () => {
    prismaMock.navigation.delete.mockResolvedValueOnce({});
    await service.deleteNavigationById('123');
    expect(prismaMock.navigation.delete).toHaveBeenCalled();
    expect(prismaMock.navigation.delete.mock.calls[0]).toMatchSnapshot();
  });

  it('should update a navigation', async () => {
    const input = { id: '123', key: 'testKey', name: 'testName', links: [] };
    prismaMock.navigation.update.mockResolvedValueOnce({});
    prismaMock.navigationLink.deleteMany.mockResolvedValueOnce({});
    await service.updateNavigation(input);
    expect(prismaMock.navigationLink.deleteMany).toHaveBeenCalled();
    expect(prismaMock.navigation.update).toHaveBeenCalled();
    expect(prismaMock.navigation.update.mock.calls[0]).toMatchSnapshot();
  });

  describe('cache', () => {
    const navigation = {
      id: 'nav-1',
      key: 'main',
      name: 'Main',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      modifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    beforeEach(() => {
      prismaMock.navigation.findMany.mockResolvedValue([navigation]);
      prismaMock.navigation.create.mockResolvedValue(navigation);
      prismaMock.navigation.update.mockResolvedValue(navigation);
      prismaMock.navigation.delete.mockResolvedValue(navigation);
    });

    it('serves the navigations from the cache', async () => {
      await service.getNavigations();
      const second = await service.getNavigations();

      expect(prismaMock.navigation.findMany).toHaveBeenCalledTimes(1);
      expect(second).toEqual([navigation]);
    });

    it.each([
      [
        'created',
        () => service.createNavigation({ key: 'new', name: 'New', links: [] }),
      ],
      [
        'updated',
        () =>
          service.updateNavigation({
            id: 'nav-1',
            key: 'main',
            name: 'Main',
            links: [],
          }),
      ],
      ['deleted', () => service.deleteNavigationById('nav-1')],
    ])('loads the navigations again after one was %s', async (_, change) => {
      await service.getNavigations();
      await change();
      await service.getNavigations();

      expect(prismaMock.navigation.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
