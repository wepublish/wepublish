import { loadAttachmentIds } from './mail-attachment';

function setup(template: { attachments: { documentId: string }[] } | null) {
  const findUnique = vi.fn(async () => template);

  return { prisma: { mailTemplate: { findUnique } } as any, findUnique };
}

describe('loadAttachmentIds', () => {
  it('reads the documents attached to the template, in their order', async () => {
    const { prisma, findUnique } = setup({
      attachments: [{ documentId: 'doc-2' }, { documentId: 'doc-1' }],
    });

    await expect(loadAttachmentIds(prisma, 'template-1')).resolves.toEqual([
      'doc-2',
      'doc-1',
    ]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'template-1' },
      select: {
        attachments: {
          select: { documentId: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  });

  it('has none for a template that does not exist', async () => {
    const { prisma } = setup(null);

    await expect(loadAttachmentIds(prisma, 'gone')).resolves.toEqual([]);
  });
});
