import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import type { NewsletterDocument } from '@wepublish/newsletter';
import { NewsletterService } from './newsletter.service';

const document: NewsletterDocument = {
  preheader: 'Hi',
  blocks: [
    { type: 'heading', text: 'Title' },
    { type: 'footer', title: 'Impressum', lines: [] },
  ],
};

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-02'),
  title: 'Issue 1',
  document,
  mailchimpCampaignId: null,
  mailchimpCampaignWebId: null,
  ...overrides,
});

describe('NewsletterService', () => {
  let service: NewsletterService;
  let prisma: {
    newsletter: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      newsletter: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        NewsletterService,
        { provide: PrismaClient, useValue: prisma },
      ],
    }).compile();

    service = module.get(NewsletterService);
    jest.clearAllMocks();
  });

  it('lists newest first with pagination info', async () => {
    prisma.newsletter.count.mockResolvedValue(3);
    prisma.newsletter.findMany.mockResolvedValue([
      row({ id: 'a' }),
      row({ id: 'b' }),
      row({ id: 'c' }),
    ]);

    const result = await service.list({ take: 2, skip: 0 });

    expect(prisma.newsletter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, orderBy: { modifiedAt: 'desc' } })
    );
    expect(result.nodes.map(node => node.id)).toEqual(['a', 'b']);
    expect(result.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('throws when a newsletter does not exist', async () => {
    prisma.newsletter.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('rejects a stored document it cannot render', async () => {
    prisma.newsletter.findUnique.mockResolvedValue(
      row({ document: { blocks: [{ type: 'video' }] } })
    );

    await expect(service.findById('n1')).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('creates from the built-in default when nothing is given', async () => {
    prisma.newsletter.create.mockImplementation(({ data }) =>
      Promise.resolve(row({ ...data, id: 'new' }))
    );

    const created = await service.create({ title: '  Issue 2  ' });

    expect(created.title).toBe('Issue 2');
    expect(created.document.blocks.some(block => block.type === 'footer')).toBe(
      true
    );
  });

  it('copies the document of another newsletter when asked to', async () => {
    prisma.newsletter.findUnique.mockResolvedValue(row());
    prisma.newsletter.create.mockImplementation(({ data }) =>
      Promise.resolve(row({ ...data, id: 'new' }))
    );

    const created = await service.create({
      title: 'Issue 2',
      fromNewsletterId: 'n1',
    });

    expect(created.document).toEqual(document);
  });

  it('refuses an empty title and an invalid document', async () => {
    await expect(service.create({ title: '  ' })).rejects.toBeInstanceOf(
      BadRequestException
    );
    await expect(
      service.create({
        title: 'x',
        document: {
          blocks: [{ type: 'button', label: 'a', href: 'javascript:1' }],
        } as unknown as NewsletterDocument,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.newsletter.create).not.toHaveBeenCalled();
  });

  it('updates title and document', async () => {
    prisma.newsletter.findUnique.mockResolvedValue(row());
    prisma.newsletter.update.mockImplementation(({ data }) =>
      Promise.resolve(row({ ...data }))
    );

    const updated = await service.update({
      id: 'n1',
      title: 'Renamed',
      document,
    });

    expect(updated.title).toBe('Renamed');
    expect(prisma.newsletter.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { title: 'Renamed', document },
    });
  });

  it('remembers the mailchimp campaign', async () => {
    prisma.newsletter.update.mockResolvedValue(row());

    await service.recordCampaign('n1', 'c1', 42);

    expect(prisma.newsletter.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { mailchimpCampaignId: 'c1', mailchimpCampaignWebId: 42 },
    });
  });
});
