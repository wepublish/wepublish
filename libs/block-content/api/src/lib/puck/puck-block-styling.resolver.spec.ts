import { ImageDataloaderService } from '@wepublish/image/api';

import { PuckBlockStylingResolver } from './puck-block-styling.resolver';

describe('PuckBlockStylingResolver', () => {
  const image = { id: 'image-1' };
  const images = {
    load: vi.fn(async () => image),
  } as unknown as ImageDataloaderService;
  const resolver = new PuckBlockStylingResolver(images);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the image the background points at', async () => {
    expect(
      await resolver.backgroundImageObject({ backgroundImage: 'image-1' })
    ).toBe(image);
    expect(images.load).toHaveBeenCalledWith('image-1');
  });

  it('is null without a background image', async () => {
    expect(await resolver.backgroundImageObject({})).toBeNull();
    expect(images.load).not.toHaveBeenCalled();
  });
});
