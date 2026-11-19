import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MediaAdapter } from '@wepublish/image/api';
import { DocumentUploadService } from './document-upload.service';

describe('DocumentUploadService.deleteDocument', () => {
  function setup(attachedTo: string[] = []) {
    const prisma = {
      mailTemplateAttachment: {
        findMany: vi.fn(async () =>
          attachedTo.map(name => ({ mailTemplate: { name } }))
        ),
      },
      document: { delete: vi.fn(async () => undefined) },
    };
    const mediaAdapter = { deleteDocument: vi.fn(async () => true) };

    const service = new DocumentUploadService(
      prisma as unknown as PrismaClient,
      mediaAdapter as unknown as MediaAdapter
    );

    return { service, prisma, mediaAdapter };
  }

  it('deletes a document no mail template attaches', async () => {
    const { service, prisma, mediaAdapter } = setup();

    expect(await service.deleteDocument('doc-1')).toBe('doc-1');
    expect(mediaAdapter.deleteDocument).toHaveBeenCalledWith('doc-1');
    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
    });
  });

  // The file would be gone from the media server before the database refused,
  // and every mail of the template would fail from then on.
  it('keeps a document a mail template attaches, naming the templates', async () => {
    const { service, prisma, mediaAdapter } = setup(['Rechnung', 'Vertrag']);

    const error = await service.deleteDocument('doc-1').catch(e => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.message).toContain('Rechnung, Vertrag');
    expect(mediaAdapter.deleteDocument).not.toHaveBeenCalled();
    expect(prisma.document.delete).not.toHaveBeenCalled();
    expect(prisma.mailTemplateAttachment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { documentId: 'doc-1' } })
    );
  });
});
