import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MailRecipientBase, MailRollingKind } from './mail-send.model';
import { SavedAudienceFilterService } from './saved-audience-filter.service';

const audience = {
  base: MailRecipientBase.hasSubscription,
  startsAtRolling: { kind: MailRollingKind.lastDays, days: 30 },
};

const makePrisma = () => ({
  savedAudienceFilter: {
    findMany: vi.fn(async () => []),
    create: vi.fn(async ({ data }: any) => ({ id: 'f1', ...data })),
    update: vi.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
    delete: vi.fn(async ({ where }: any) => ({ id: where.id })),
  },
});

const makeService = (prisma: ReturnType<typeof makePrisma>) =>
  new SavedAudienceFilterService(prisma as unknown as PrismaClient);

const prismaError = (code: string) => Object.assign(new Error(code), { code });

describe('SavedAudienceFilterService', () => {
  it('lists the filters by name', async () => {
    const prisma = makePrisma();

    await makeService(prisma).list();

    expect(prisma.savedAudienceFilter.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('keeps the audience as it was built, rolling dates included', async () => {
    const prisma = makePrisma();

    await makeService(prisma).create(
      { name: ' Reminded twice ', description: ' For letters ', audience },
      'editor-1'
    );

    expect(prisma.savedAudienceFilter.create).toHaveBeenCalledWith({
      data: {
        name: 'Reminded twice',
        description: 'For letters',
        audience,
        createdByUserId: 'editor-1',
      },
    });
  });

  it('stores no description when it is left empty', async () => {
    const prisma = makePrisma();

    await makeService(prisma).create(
      { name: 'A', description: '  ', audience },
      'editor-1'
    );

    expect(
      prisma.savedAudienceFilter.create.mock.calls[0][0].data.description
    ).toBeNull();
  });

  it('refuses a filter without a name', async () => {
    const prisma = makePrisma();

    await expect(
      makeService(prisma).create({ name: '  ', audience }, 'editor-1')
    ).rejects.toThrow('name');
    expect(prisma.savedAudienceFilter.create).not.toHaveBeenCalled();
  });

  it('says so when the name is taken', async () => {
    const prisma = makePrisma();
    prisma.savedAudienceFilter.create.mockRejectedValue(prismaError('P2002'));

    await expect(
      makeService(prisma).create({ name: 'A', audience }, 'editor-1')
    ).rejects.toThrow(ConflictException);
  });

  it('changes only what an update names', async () => {
    const prisma = makePrisma();

    await makeService(prisma).update('f1', { description: 'New' });

    expect(prisma.savedAudienceFilter.update).toHaveBeenCalledWith({
      where: { id: 'f1' },
      data: { description: 'New' },
    });
  });

  it('replaces the audience of a filter', async () => {
    const prisma = makePrisma();

    await makeService(prisma).update('f1', { audience });

    expect(prisma.savedAudienceFilter.update).toHaveBeenCalledWith({
      where: { id: 'f1' },
      data: { audience },
    });
  });

  it('clears a description that is emptied', async () => {
    const prisma = makePrisma();

    await makeService(prisma).update('f1', { description: '' });

    expect(prisma.savedAudienceFilter.update.mock.calls[0][0].data).toEqual({
      description: null,
    });
  });

  it('reports a filter that is gone, on update and on delete', async () => {
    const prisma = makePrisma();
    prisma.savedAudienceFilter.update.mockRejectedValue(prismaError('P2025'));
    prisma.savedAudienceFilter.delete.mockRejectedValue(prismaError('P2025'));
    const service = makeService(prisma);

    await expect(service.update('gone', { name: 'B' })).rejects.toThrow(
      NotFoundException
    );
    await expect(service.delete('gone')).rejects.toThrow(NotFoundException);
  });

  it('deletes a filter', async () => {
    const prisma = makePrisma();

    await makeService(prisma).delete('f1');

    expect(prisma.savedAudienceFilter.delete).toHaveBeenCalledWith({
      where: { id: 'f1' },
    });
  });
});
