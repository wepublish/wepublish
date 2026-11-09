import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LetterContext } from '../letter-context';
import { LetterLayoutService } from './letter-layout.service';

const layout = (overrides: Record<string, unknown> = {}) => ({
  id: 'layout-1',
  name: 'Briefpapier',
  headerHtml: '<b>Zwölf</b>',
  footerHtml: '<i>IBAN</i>',
  headerHeightMm: 30,
  footerHeightMm: 20,
  isDefault: false,
  ...overrides,
});

const input = (overrides: Record<string, unknown> = {}) => ({
  name: 'Briefpapier',
  headerHtml: '<b>Zwölf</b>',
  footerHtml: '<i>IBAN</i>',
  headerHeightMm: 30,
  footerHeightMm: 20,
  isDefault: false,
  ...overrides,
});

const makePrisma = () => {
  const prisma = {
    letterLayout: {
      findMany: vi.fn(async () => [layout()]),
      findUnique: vi.fn(async () => layout({ _count: { mailTemplates: 0 } })),
      create: vi.fn(async ({ data }: any) => layout(data)),
      update: vi.fn(async ({ data }: any) => layout(data)),
      updateMany: vi.fn(async () => ({ count: 1 })),
      delete: vi.fn(async () => layout()),
    },
    $transaction: vi.fn(async (run: (tx: unknown) => unknown) => run(prisma)),
  };

  return prisma;
};

const makeService = (
  prisma = makePrisma(),
  letterContext: any = {
    renderLetter: vi.fn(async () => Buffer.from('%PDF-1.4 stationery')),
  }
) => ({
  service: new LetterLayoutService(
    prisma as unknown as PrismaClient,
    letterContext as LetterContext
  ),
  prisma,
  letterContext,
});

describe('LetterLayoutService', () => {
  it('lists the default first, then by name', async () => {
    const { service, prisma } = makeService();

    await service.list();

    expect(prisma.letterLayout.findMany).toHaveBeenCalledWith({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  });

  it('tells a missing layout apart from an empty one', async () => {
    const { service, prisma } = makeService();
    prisma.letterLayout.findUnique.mockResolvedValue(null as never);

    await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
  });

  it('refuses a band taller than the franking zone allows', async () => {
    const { service, prisma } = makeService();

    await expect(service.create(input({ headerHeightMm: 41 }))).rejects.toThrow(
      BadRequestException
    );
    await expect(service.create(input({ footerHeightMm: -1 }))).rejects.toThrow(
      BadRequestException
    );
    expect(prisma.letterLayout.create).not.toHaveBeenCalled();
  });

  it('refuses a layout without a name', async () => {
    const { service } = makeService();

    await expect(service.create(input({ name: '  ' }))).rejects.toThrow(
      BadRequestException
    );
  });

  it('makes a new default the only default', async () => {
    const { service, prisma } = makeService();

    await service.create(input({ isDefault: true }));

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.letterLayout.updateMany).toHaveBeenCalledWith({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    expect(prisma.letterLayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isDefault: true }),
    });
  });

  it('leaves the other layouts alone when the new one is not the default', async () => {
    const { service, prisma } = makeService();

    await service.create(input());

    expect(prisma.letterLayout.updateMany).not.toHaveBeenCalled();
  });

  it('clears the previous default when another layout takes over', async () => {
    const { service, prisma } = makeService();

    await service.update('layout-2', input({ isDefault: true }));

    expect(prisma.letterLayout.updateMany).toHaveBeenCalledWith({
      where: { isDefault: true, id: { not: 'layout-2' } },
      data: { isDefault: false },
    });
    expect(prisma.letterLayout.update).toHaveBeenCalledWith({
      where: { id: 'layout-2' },
      data: expect.objectContaining({ isDefault: true }),
    });
  });

  it('refuses to delete stationery templates still print on', async () => {
    const { service, prisma } = makeService();
    prisma.letterLayout.findUnique.mockResolvedValue(
      layout({ _count: { mailTemplates: 2 } }) as never
    );

    await expect(service.delete('layout-1')).rejects.toThrow(
      BadRequestException
    );
    expect(prisma.letterLayout.delete).not.toHaveBeenCalled();
  });

  it('deletes stationery nothing prints on', async () => {
    const { service, prisma } = makeService();

    await service.delete('layout-1');

    expect(prisma.letterLayout.delete).toHaveBeenCalledWith({
      where: { id: 'layout-1' },
    });
  });

  it('previews the stationery on a sample letter long enough for two pages', async () => {
    const { service, letterContext } = makeService();

    const result = await service.preview({
      headerHtml: '<b>Zwölf</b>',
      footerHtml: '<i>IBAN</i>',
      headerHeightMm: 30,
      footerHeightMm: 20,
    });

    expect(Buffer.from(result.pdf, 'base64').toString()).toBe(
      '%PDF-1.4 stationery'
    );
    expect(letterContext.renderLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({ headerHtml: '<b>Zwölf</b>' }),
        addressPosition: 'left',
        recipient: expect.objectContaining({ name: 'Jane Doe' }),
        data: expect.objectContaining({
          user: expect.objectContaining({ firstName: 'Jane' }),
        }),
      })
    );
    const { template } = letterContext.renderLetter.mock.calls[0][0];
    expect(template.htmlContent.split('<p>').length).toBeGreaterThan(10);
  });
});
