import { BadRequestException } from '@nestjs/common';
import { MailContext } from '@wepublish/mail/api';
import { LetterContext } from '@wepublish/letter/api';
import { PrismaClient } from '@prisma/client';
import { MailTemplateService } from './mail-template.service';

const makeService = (
  prisma: any,
  mailContext: any = {},
  letterContext: any = {}
) =>
  new MailTemplateService(
    prisma as PrismaClient,
    mailContext as unknown as MailContext,
    letterContext as unknown as LetterContext
  );

describe('MailTemplateService', () => {
  describe('deleteMailTemplate', () => {
    const prismaWithCounts = (counts: {
      subscriptionIntervals: number;
      userFlowMails: number;
      mailLog: number;
    }) => ({
      mailTemplate: {
        findUnique: jest.fn(async () => ({ id: 't1', _count: counts })),
        delete: jest.fn(async () => undefined),
      },
    });

    it('refuses when assigned to a subscription flow', async () => {
      const prisma = prismaWithCounts({
        subscriptionIntervals: 1,
        userFlowMails: 0,
        mailLog: 0,
      });
      await expect(
        makeService(prisma).deleteMailTemplate('t1')
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mailTemplate.delete).not.toHaveBeenCalled();
    });

    it('refuses when assigned to a system mail', async () => {
      const prisma = prismaWithCounts({
        subscriptionIntervals: 0,
        userFlowMails: 1,
        mailLog: 0,
      });
      await expect(
        makeService(prisma).deleteMailTemplate('t1')
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses when it has already sent mails', async () => {
      const prisma = prismaWithCounts({
        subscriptionIntervals: 0,
        userFlowMails: 0,
        mailLog: 3,
      });
      await expect(
        makeService(prisma).deleteMailTemplate('t1')
      ).rejects.toThrow(BadRequestException);
    });

    it('deletes when unused', async () => {
      const prisma = prismaWithCounts({
        subscriptionIntervals: 0,
        userFlowMails: 0,
        mailLog: 0,
      });
      await makeService(prisma).deleteMailTemplate('t1');
      expect(prisma.mailTemplate.delete).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
    });
  });

  describe('importFromProvider', () => {
    const makeImportService = (remoteTemplates: any[]) => {
      const upsert = jest.fn(async (args: any) => args);
      const service = makeService(
        { mailTemplate: { upsert } },
        {
          mailProvider: { listTemplates: jest.fn(async () => remoteTemplates) },
        }
      );

      return { service, upsert };
    };

    it('creates a local template for every remote one, not just already-linked rows', async () => {
      const { service, upsert } = makeImportService([
        {
          externalId: 'welcome',
          name: 'Welcome',
          html: '<p>a</p>',
          subject: 'A',
        },
        {
          externalId: 'renewal',
          name: 'Renewal',
          html: '<p>b</p>',
          subject: 'B',
        },
      ]);

      await expect(service.importFromProvider()).resolves.toBe(2);
      expect(upsert).toHaveBeenCalledTimes(2);
      expect(upsert).toHaveBeenCalledWith({
        where: { externalMailTemplateId: 'welcome' },
        create: {
          name: 'Welcome',
          externalMailTemplateId: 'welcome',
          htmlContent: '<p>a</p>',
          subject: 'A',
        },
        update: { htmlContent: '<p>a</p>', subject: 'A' },
      });
    });

    it('converts mandrill merge tags in html and subject', async () => {
      const { service, upsert } = makeImportService([
        {
          externalId: 'welcome',
          name: 'Welcome',
          html: '<p>Hi *|USER_FIRSTNAME|*</p>',
          subject: 'Hello *|USER_NAME|*',
        },
      ]);

      await service.importFromProvider();

      expect(upsert.mock.calls[0][0].create).toMatchObject({
        htmlContent: '<p>Hi {{USER_FIRSTNAME}}</p>',
        subject: 'Hello {{USER_NAME}}',
      });
    });

    it('keeps the local subject when the provider has none', async () => {
      const { service, upsert } = makeImportService([
        { externalId: 'plain', name: 'Plain', html: '<p>a</p>' },
      ]);

      await service.importFromProvider();

      expect(upsert.mock.calls[0][0].update).toEqual({
        htmlContent: '<p>a</p>',
      });
      expect(upsert.mock.calls[0][0].create.subject).toBe('');
    });

    it('imports nothing for a provider without a remote template store', async () => {
      const { service, upsert } = makeImportService([]);

      await expect(service.importFromProvider()).resolves.toBe(0);
      expect(upsert).not.toHaveBeenCalled();
    });

    it('surfaces a provider failure instead of reporting zero imports', async () => {
      const service = makeService(
        { mailTemplate: { upsert: jest.fn() } },
        {
          mailProvider: {
            listTemplates: jest.fn(async () => {
              throw new Error('Invalid API key');
            }),
          },
        }
      );

      await expect(service.importFromProvider()).rejects.toThrow(
        'Invalid API key'
      );
    });
  });

  describe('preview (sample data, no subscription)', () => {
    it('renders subject and html with sample subscription data', async () => {
      const service = makeService({});
      const result = await service.preview({
        contextId: 'renewal',
        subscriptionId: null,
        subject:
          'Hi {{user_firstName}} — {{optional_subscription_memberPlan_name}}',
        html: '<p>{{optional_subscription_monthlyAmount_display}}</p>',
        text: null,
      });

      expect(result.subject).toBe('Hi Jane — Jahres-Abo');
      expect(result.html).toContain('CHF 10.00');
    });
  });

  describe('isLetterChannelAvailable', () => {
    it.each([true, false])(
      'reports whether letters are configured (%s)',
      configured => {
        const service = makeService({}, {}, { isConfigured: () => configured });

        expect(service.isLetterChannelAvailable()).toBe(configured);
      }
    );
  });

  describe('previewLetter', () => {
    const renderLetter = () =>
      jest.fn(async () => Buffer.from('%PDF-1.4 letter'));

    it('renders the draft with sample data and a sample address', async () => {
      const render = renderLetter();
      const service = makeService({}, {}, { renderLetter: render });

      const result = await service.previewLetter({
        contextId: 'renewal',
        subscriptionId: null,
        html: '<p>{{optional_subscription_memberPlan_name}}</p>',
      });

      expect(Buffer.from(result.pdf, 'base64').toString()).toBe(
        '%PDF-1.4 letter'
      );
      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          template: {
            htmlContent: '<p>{{optional_subscription_memberPlan_name}}</p>',
          },
          addressPosition: 'left',
          data: expect.objectContaining({
            user: expect.objectContaining({ firstName: 'Jane' }),
            optional: expect.objectContaining({
              subscription: expect.objectContaining({ id: expect.any(String) }),
            }),
          }),
          recipient: expect.objectContaining({
            name: 'Jane Doe',
            zip: expect.any(String),
            city: expect.any(String),
            country: 'CH',
          }),
        })
      );
    });

    it("addresses the letter to the chosen subscription's user", async () => {
      const render = renderLetter();
      const user = {
        id: 'u1',
        firstName: 'Max',
        name: 'Muster',
        address: {
          company: null,
          streetAddress: 'Bahnhofstrasse',
          streetAddressNumber: '1',
          streetAddress2: null,
          streetAddress2Number: null,
          zipCode: '3000',
          city: 'Bern',
          country: 'Schweiz',
        },
      };
      const prisma = {
        subscription: {
          findUnique: jest.fn(async () => ({ id: 's1', user })),
        },
        invoice: { findFirst: jest.fn(async () => null) },
      };
      const service = makeService(prisma, {}, { renderLetter: render });

      await service.previewLetter({
        contextId: 'subscription',
        subscriptionId: 's1',
        html: '<p>Hallo</p>',
      });

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: { include: { address: true } },
          }),
        })
      );
      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: expect.objectContaining({
            name: 'Max Muster',
            street: 'Bahnhofstrasse',
            city: 'Bern',
            country: 'CH',
          }),
        })
      );
    });

    it('refuses a subscription whose user has no usable address', async () => {
      const render = renderLetter();
      const prisma = {
        subscription: {
          findUnique: jest.fn(async () => ({
            id: 's1',
            user: { id: 'u1', email: 'max@example.com', address: null },
          })),
        },
        invoice: { findFirst: jest.fn(async () => null) },
      };
      const service = makeService(prisma, {}, { renderLetter: render });

      await expect(
        service.previewLetter({
          contextId: 'subscription',
          subscriptionId: 's1',
          html: '<p>Hallo</p>',
        })
      ).rejects.toThrow(BadRequestException);
      expect(render).not.toHaveBeenCalled();
    });
  });

  describe('getPlaceholderKeysByContext (server source of truth)', () => {
    it('derives the resolvable keys (incl. computed) per context', () => {
      const groups = makeService({}).getPlaceholderKeysByContext();
      const renewal = groups.find(g => g.contextId === 'renewal');
      const keys = renewal!.keys.map(k => k.key);

      // raw, relational, computed and date-format keys all present
      expect(keys).toContain('user_email');
      expect(keys).toContain('optional_subscription_memberPlan_name');
      expect(keys).toContain('optional_subscription_monthlyAmount_display');
      expect(keys).toContain('optional_subscription_startsAt_date');
      expect(keys).toContain('optional_invoice_total_display');
    });
  });
});
