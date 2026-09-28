import { ImageUploadService } from './image-upload.service';

describe('ImageUploadService.replaceImage', () => {
  const setup = (uploadedId = 'image-2') => {
    const prisma = {
      image: {
        update: vi.fn().mockResolvedValue({ id: uploadedId }),
        delete: vi.fn(),
      },
    };
    const mediaAdapter = {
      uploadImage: vi.fn().mockResolvedValue({ id: uploadedId }),
      deleteImage: vi.fn().mockResolvedValue(true),
    };
    const publicContentCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
      invalidateDraft: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ImageUploadService(
      prisma as any,
      mediaAdapter as any,
      publicContentCache as any
    );

    return { service, prisma, mediaAdapter };
  };

  const upload = { file: Promise.resolve({}) } as any;

  it('removes the old file once the row carries the id of the new one, without deleting the row', async () => {
    const { service, prisma, mediaAdapter } = setup();

    await expect(service.replaceImage('image-1', upload)).resolves.toEqual({
      id: 'image-2',
    });

    expect(prisma.image.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'image-1' },
        data: expect.objectContaining({ id: 'image-2' }),
      })
    );
    expect(mediaAdapter.deleteImage).toHaveBeenCalledWith('image-1');
    expect(mediaAdapter.deleteImage).not.toHaveBeenCalledWith('image-2');
    expect(prisma.image.update.mock.invocationCallOrder[0]).toBeLessThan(
      mediaAdapter.deleteImage.mock.invocationCallOrder[0]
    );
    expect(prisma.image.delete).not.toHaveBeenCalled();
  });

  it('keeps the file when the media server answers with the same id', async () => {
    const { service, mediaAdapter } = setup('image-1');

    await service.replaceImage('image-1', upload);

    expect(mediaAdapter.deleteImage).not.toHaveBeenCalled();
  });

  it('keeps the old file when the row could not be updated', async () => {
    const { service, prisma, mediaAdapter } = setup();
    prisma.image.update.mockRejectedValue(new Error('not found'));

    await expect(service.replaceImage('image-1', upload)).rejects.toThrow(
      'not found'
    );

    expect(mediaAdapter.deleteImage).not.toHaveBeenCalledWith('image-1');
  });
});
