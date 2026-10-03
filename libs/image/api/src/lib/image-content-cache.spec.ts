import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { ImageDataloaderService } from './image-dataloader.service';

describe('image content cache', () => {
  let kv: KvTtlCacheService;
  const prisma = { image: { findMany: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma.image.findMany
      .mockReset()
      .mockResolvedValue([{ id: 'image-1', createdAt: new Date() }]);
  });

  it('loads an image from the database once across requests', async () => {
    await new ImageDataloaderService(prisma as any, kv).load('image-1');
    const image = await new ImageDataloaderService(prisma as any, kv).load(
      'image-1'
    );

    expect(image?.createdAt).toBeInstanceOf(Date);
    expect(prisma.image.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads it again once images changed', async () => {
    await new ImageDataloaderService(prisma as any, kv).load('image-1');
    await new PublicContentCacheInvalidator(kv).invalidateDraft('images');
    await new ImageDataloaderService(prisma as any, kv).load('image-1');

    expect(prisma.image.findMany).toHaveBeenCalledTimes(2);
  });
});
