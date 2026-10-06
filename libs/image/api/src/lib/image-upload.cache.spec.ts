import { ImageUploadService } from './image-upload.service';

describe('image upload cache', () => {
  const setup = () => {
    const prisma = {
      image: {
        create: jest.fn().mockResolvedValue({ id: 'image-2' }),
        update: jest.fn().mockResolvedValue({ id: 'image-2' }),
        delete: jest.fn().mockResolvedValue({ id: 'image-1' }),
      },
    };
    const mediaAdapter = {
      uploadImage: jest.fn().mockResolvedValue({ id: 'image-2' }),
      deleteImage: jest.fn().mockResolvedValue(undefined),
    };
    const publicContentCache = {
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateDraft: jest.fn().mockResolvedValue(undefined),
    };
    const service = Object.assign(
      new ImageUploadService(
        prisma as any,
        mediaAdapter as any,
        publicContentCache as any
      ),
      { __DATALOADER__ImageDataloaderService: { prime: jest.fn() } }
    );

    return { service, publicContentCache };
  };

  const upload = { file: Promise.resolve({}) } as any;

  it('refreshes images by tag after an upload without rebuilding public content', async () => {
    const { service, publicContentCache } = setup();

    await service.uploadImage(upload);

    expect(publicContentCache.invalidateDraft).toHaveBeenCalledWith('images');
    expect(publicContentCache.invalidate).not.toHaveBeenCalled();
  });

  it.each<[string, (service: ImageUploadService) => Promise<unknown>]>([
    ['replaces', service => service.replaceImage('image-1', upload)],
    ['deletes', service => service.deleteImage('image-1')],
  ])(
    'rebuilds public content when an editor %s an image articles may show',
    async (_, change) => {
      const { service, publicContentCache } = setup();

      await change(service);

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('images');
    }
  );

  it.each<[string, (service: ImageUploadService) => Promise<unknown>]>([
    [
      'replaces',
      service =>
        service.replaceImage('image-1', upload, { profileImage: true }),
    ],
    [
      'deletes',
      service => service.deleteImage('image-1', { profileImage: true }),
    ],
  ])(
    'only refreshes images when a reader %s their profile image',
    async (_, change) => {
      const { service, publicContentCache } = setup();

      await change(service);

      expect(publicContentCache.invalidateDraft).toHaveBeenCalledWith('images');
      expect(publicContentCache.invalidate).not.toHaveBeenCalled();
    }
  );
});
