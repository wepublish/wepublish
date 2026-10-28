import { Test, type TestingModule } from '@nestjs/testing';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import {
  PUBLIC_CONTENT_SHARED_NAMESPACES,
  PublicContentCacheInvalidator,
  PublicContentInvalidatorModule,
} from '@wepublish/public-content-cache/api';
import { ImageDataloaderService } from './image-dataloader.service';

describe('image content cache', () => {
  let module: TestingModule;
  let kv: NamespacedCache;
  let invalidator: PublicContentCacheInvalidator;
  const prisma = { image: { findMany: vi.fn() } };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          sharedNamespaces: PUBLIC_CONTENT_SHARED_NAMESPACES,
        }),
        PublicContentInvalidatorModule,
      ],
    }).compile();
    kv = module.get(NamespacedCache);
    invalidator = module.get(PublicContentCacheInvalidator);
    prisma.image.findMany
      .mockReset()
      .mockResolvedValue([{ id: 'image-1', createdAt: new Date() }]);
  });

  afterEach(() => module.close());

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
    await invalidator.invalidateDraft('images');
    await new ImageDataloaderService(prisma as any, kv).load('image-1');

    expect(prisma.image.findMany).toHaveBeenCalledTimes(2);
  });
});
