import type { Mock } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NewsletterCampaignService } from './newsletter-campaign.service';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';
import { NewsletterRenderService } from './newsletter-render.service';

const document = {
  preheader: 'Vorschau',
  blocks: [{ type: 'divider' }, { type: 'divider' }],
};

const row = {
  id: 'campaign-1',
  title: 'Ausgabe 1',
  document,
  createdAt: new Date('2026-10-01'),
  modifiedAt: new Date('2026-10-02'),
  mailchimpCampaignId: 'mc-1',
  mailchimpCampaignWebId: 42,
};

const FOOTER_HTML = '<p>*|UNSUB|* *|LIST:ADDRESSLINE|*</p>';

describe('NewsletterCampaignService', () => {
  let service: NewsletterCampaignService;
  let prisma: {
    newsletterCampaign: Record<
      'findMany' | 'findUnique' | 'create' | 'update' | 'delete',
      Mock
    >;
  };
  let renderer: { render: Mock };
  let mailchimp: { pushDraft: Mock; editUrls: Mock };

  beforeEach(async () => {
    prisma = {
      newsletterCampaign: {
        findMany: vi.fn().mockResolvedValue([row]),
        findUnique: vi.fn().mockResolvedValue(row),
        create: vi.fn(async ({ data }) => ({ ...row, ...data })),
        update: vi.fn(async ({ data }) => ({ ...row, ...data })),
        delete: vi.fn().mockResolvedValue(row),
      },
    };
    renderer = {
      render: vi.fn(async (doc: typeof document) => ({
        html: FOOTER_HTML,
        document: doc,
        missing: [],
      })),
    };
    mailchimp = {
      pushDraft: vi.fn().mockResolvedValue({
        created: true,
        campaign: { id: 'mc-2', webId: 43, title: 'Ausgabe 1', editUrl: 'url' },
      }),
      editUrls: vi
        .fn()
        .mockResolvedValue((webId: number) => `https://mc/edit?id=${webId}`),
    };

    const module = await Test.createTestingModule({
      providers: [
        NewsletterCampaignService,
        { provide: PrismaClient, useValue: prisma },
        { provide: NewsletterRenderService, useValue: renderer },
        { provide: NewsletterMailchimpService, useValue: mailchimp },
      ],
    }).compile();

    service = module.get(NewsletterCampaignService);
  });

  it('lists the newest first, with block count and draft link', async () => {
    expect(await service.list()).toEqual([
      expect.objectContaining({
        id: 'campaign-1',
        blockCount: 2,
        mailchimpEditUrl: 'https://mc/edit?id=42',
      }),
    ]);
    expect(prisma.newsletterCampaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { modifiedAt: 'desc' } })
    );
  });

  it('reports an unknown id as not found', async () => {
    prisma.newsletterCampaign.findUnique.mockResolvedValue(null);

    await expect(service.get('nope')).rejects.toThrow(NotFoundException);
    await expect(service.update('nope', undefined, document)).rejects.toThrow(
      NotFoundException
    );
    expect(prisma.newsletterCampaign.update).not.toHaveBeenCalled();
  });

  const created = () => prisma.newsletterCampaign.create.mock.calls[0][0].data;

  it('starts a new issue with its title, a placeholder text and the footer', async () => {
    await service.create('  Ausgabe 2  ');

    expect(created()).toEqual({
      title: 'Ausgabe 2',
      document: {
        preheader: '',
        blocks: [
          expect.objectContaining({ type: 'heading', text: 'Ausgabe 2' }),
          expect.objectContaining({
            type: 'text',
            paragraphs: [expect.stringContaining('Lorem ipsum')],
          }),
          expect.objectContaining({ type: 'footer' }),
        ],
      },
    });
  });

  it('takes a given document as it is', async () => {
    await service.create('Ausgabe 2', document);

    expect(created().document.blocks).toHaveLength(2);
  });

  it('duplicates an issue under a new title, without its Mailchimp draft', async () => {
    const copy = await service.duplicate('campaign-1');

    expect(created()).toEqual({
      title: 'Ausgabe 1 (Kopie)',
      document: expect.objectContaining({ preheader: 'Vorschau' }),
    });
    expect(created().document.blocks).toHaveLength(2);
    expect(copy).toEqual(
      expect.objectContaining({ title: 'Ausgabe 1 (Kopie)' })
    );
  });

  it('reports duplicating an unknown id as not found', async () => {
    prisma.newsletterCampaign.findUnique.mockResolvedValue(null);

    await expect(service.duplicate('nope')).rejects.toThrow(NotFoundException);
    expect(prisma.newsletterCampaign.create).not.toHaveBeenCalled();
  });

  it('refuses an issue without a title', async () => {
    await expect(service.create('  ')).rejects.toThrow(
      'Bitte einen Titel für die Ausgabe angeben.'
    );
  });

  it('validates a document before storing it', async () => {
    await expect(
      service.update('campaign-1', undefined, {
        preheader: '',
        blocks: [{ type: 'video' }],
      })
    ).rejects.toThrow('ist unbekannt');
    expect(prisma.newsletterCampaign.update).not.toHaveBeenCalled();
  });

  it('keeps the title when an update brings none', async () => {
    await service.update('campaign-1', ' ', document);

    expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: { title: 'Ausgabe 1', document: expect.anything() },
    });
  });

  it('refuses to publish an issue with articles that are gone, before Mailchimp is asked', async () => {
    renderer.render.mockResolvedValue({
      html: FOOTER_HTML,
      document,
      missing: ['article-1'],
    });

    await expect(service.publish('campaign-1')).rejects.toThrow(
      '1 Artikel konnten nicht geladen werden'
    );
    expect(mailchimp.pushDraft).not.toHaveBeenCalled();
  });

  it('refuses to publish an issue without unsubscribe link', async () => {
    renderer.render.mockResolvedValue({
      html: '<p></p>',
      document,
      missing: [],
    });

    await expect(service.publish('campaign-1')).rejects.toThrow(
      'ein Abmeldelink (*|UNSUB|*)'
    );
    expect(mailchimp.pushDraft).not.toHaveBeenCalled();
  });

  it('pushes into the remembered draft and remembers the one it ends up in', async () => {
    const result = await service.publish('campaign-1');

    expect(mailchimp.pushDraft).toHaveBeenCalledWith(
      'mc-1',
      { title: 'Ausgabe 1', subject: 'Ausgabe 1', previewText: 'Vorschau' },
      FOOTER_HTML
    );
    expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: { mailchimpCampaignId: 'mc-2', mailchimpCampaignWebId: 43 },
    });
    expect(result.report).toEqual({
      bytes: FOOTER_HTML.length,
      missingFooter: [],
      missingArticles: [],
    });
  });
});
