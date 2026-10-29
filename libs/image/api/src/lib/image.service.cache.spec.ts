import { ImageService } from './image.service';
import { ImageUploadService } from './image-upload.service';

describe('image cache', () => {
  const publicContentCache = { invalidate: vi.fn() };
  const image = { id: 'image-1' };
  const prisma = {
    image: {
      create: vi.fn().mockResolvedValue(image),
      update: vi.fn().mockResolvedValue(image),
      delete: vi.fn().mockResolvedValue(image),
    },
  } as any;
  const mediaAdapter = {
    uploadImage: vi.fn().mockResolvedValue({ id: 'image-2' }),
    deleteImage: vi.fn().mockResolvedValue(undefined),
  } as any;
  const upload = new ImageUploadService(
    prisma,
    mediaAdapter,
    publicContentCache as any
  );
  const images = new ImageService(prisma, upload, publicContentCache as any);

  beforeEach(() => {
    Object.assign(images, {
      __DATALOADER__ImageDataloaderService: { prime: vi.fn() },
    });
    Object.assign(upload, {
      __DATALOADER__ImageDataloaderService: { prime: vi.fn() },
    });
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
  });

  it.each<[string, () => Promise<unknown>]>([
    ['updating', () => images.updateImage({ id: 'image-1' } as any)],
    ['deleting', () => images.deleteImage('image-1')],
    [
      'replacing',
      () =>
        upload.replaceImage('image-1', { file: Promise.resolve({}) } as any),
    ],
  ])(
    'clears cached images and answers after %s an image',
    async (_, change) => {
      await change();

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('images');
    }
  );
});
