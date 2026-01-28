import { Test, TestingModule } from '@nestjs/testing';
import {
  BannerAction,
  BannerActionRole,
  LoginStatus,
  PrismaClient,
} from '@prisma/client';
import { BannerActionService } from './banner-action.service';
import { Banner } from './banner.model';
import {} from './banner-action.model';

describe('BannerActionService', () => {
  let service: BannerActionService;
  let prisma: PrismaClient;

  const bannerAction: BannerAction = {
    id: '1',
    createdAt: new Date(),
    modifiedAt: new Date(),
    label: 'Test Action',
    url: 'https://test.com',
    style: 'outline',
    role: BannerActionRole.OTHER,
    bannerId: '1',
  };

  const banner: Banner = {
    id: '1',
    title: 'Test Banner',
    text: 'Test Banner Text',
    cta: undefined,
    imageId: undefined,
    active: true,
    delay: 0,
    showOnArticles: true,
    showForLoginStatus: LoginStatus.ALL,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerActionService,
        {
          provide: PrismaClient,
          useValue: {
            bannerAction: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BannerActionService>(BannerActionService);
    prisma = module.get<PrismaClient>(PrismaClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a banner action', async () => {
      jest
        .spyOn(prisma.bannerAction, 'findUnique')
        .mockResolvedValue(bannerAction);
      expect(await service.findOne('1')).toEqual(bannerAction);
    });

    it('should return null if banner action not found', async () => {
      jest.spyOn(prisma.bannerAction, 'findUnique').mockResolvedValue(null);
      expect(await service.findOne('1')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of banner actions', async () => {
      const bannerActions = [bannerAction];
      jest
        .spyOn(prisma.bannerAction, 'findMany')
        .mockResolvedValue(bannerActions);
      expect(await service.findAll({ bannerId: '1' })).toEqual(bannerActions);
    });
  });

  describe('create', () => {
    it('should create a new banner action', async () => {
      const createBannerActionInput = {
        label: 'Test Action',
        url: 'https://test.com',
        style: 'outline',
        role: BannerActionRole.OTHER,
      };
      jest.spyOn(prisma.bannerAction, 'create').mockResolvedValue(bannerAction);
      expect(await service.create(banner, createBannerActionInput)).toEqual(
        bannerAction
      );
    });
  });

  describe('update', () => {
    it('should update a banner action', async () => {
      const updatedBannerAction = { ...bannerAction, label: 'Updated Action' };
      const updateBannerActionInput = {
        id: '1',
        label: 'Updated Action',
        url: 'https://test.com',
        style: 'outline',
        role: BannerActionRole.OTHER,
      };
      jest
        .spyOn(prisma.bannerAction, 'update')
        .mockResolvedValue(updatedBannerAction);
      expect(await service.update(updateBannerActionInput)).toEqual(
        updatedBannerAction
      );
    });
  });

  describe('delete', () => {
    it('should delete a banner action', async () => {
      jest.spyOn(prisma.bannerAction, 'delete').mockResolvedValue(bannerAction);
      expect(await service.delete('1')).toBeUndefined();
    });
  });
});
