import '@wepublish/block-content/api';
import { Test } from '@nestjs/testing';
import { SlotTeasersLoader } from '@wepublish/block-content/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { EventRevisionImagesDataloader } from './event-details.dataloader';
import {
  EventImageResolver,
  EventRevisionResolver,
} from './event-revision.resolver';

describe('EventRevisionResolver', () => {
  const setup = async () => {
    const slotTeasersLoader = {
      loadSlotTeasersIntoBlocks: vi.fn(async (blocks: unknown[]) => blocks),
    };
    const images = { load: vi.fn(async () => [{ imageId: 'img-1' }]) };

    const module = await Test.createTestingModule({
      providers: [
        EventRevisionResolver,
        { provide: SlotTeasersLoader, useValue: slotTeasersLoader },
        { provide: EventRevisionImagesDataloader, useValue: images },
      ],
    }).compile();

    return {
      resolver: await module.resolve(EventRevisionResolver),
      slotTeasersLoader,
      images,
    };
  };

  it('resolves its dependencies when block-content is loaded first, as at boot', async () => {
    const { resolver } = await setup();

    expect(resolver).toBeInstanceOf(EventRevisionResolver);
  });

  it('loads the blocks through the slot teaser loader', async () => {
    const { resolver, slotTeasersLoader } = await setup();
    const blocks = [{ type: 'richText', richText: null }];

    await expect(
      resolver.blocks({ id: 'rev-1', blocks } as any)
    ).resolves.toEqual(blocks);
    expect(slotTeasersLoader.loadSlotTeasersIntoBlocks).toHaveBeenCalledWith(
      blocks
    );
  });

  it('treats missing blocks as none', async () => {
    const { resolver, slotTeasersLoader } = await setup();

    await resolver.blocks({ id: 'rev-1', blocks: null } as any);

    expect(slotTeasersLoader.loadSlotTeasersIntoBlocks).toHaveBeenCalledWith(
      []
    );
  });

  it('loads the images of the revision', async () => {
    const { resolver, images } = await setup();

    await expect(resolver.images({ id: 'rev-1' } as any)).resolves.toEqual([
      { imageId: 'img-1' },
    ]);
    expect(images.load).toHaveBeenCalledWith('rev-1');
  });
});

describe('EventImageResolver', () => {
  it('resolves the image through the image dataloader', async () => {
    const imageDataloader = { load: vi.fn(async (id: string) => ({ id })) };
    const module = await Test.createTestingModule({
      providers: [
        EventImageResolver,
        { provide: ImageDataloaderService, useValue: imageDataloader },
      ],
    }).compile();
    const resolver = await module.resolve(EventImageResolver);

    await expect(resolver.image({ imageId: 'img-1' } as any)).resolves.toEqual({
      id: 'img-1',
    });
  });
});
