import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MailContext } from '@wepublish/mail/api';
import {
  DocumentAttachmentRenderer,
  DOCX_MIME_TYPE,
  LetterContext,
  MAX_ATTACHMENT_BYTES,
  MAX_TEMPLATE_ATTACHMENTS,
} from '@wepublish/letter/api';
import { MailChannel, MailTemplateContext, PrismaClient } from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { MailTemplateService } from './mail-template.service';
import { version } from 'uuid';

const makeService = (
  prisma: any,
  mailContext: any = {},
  letterContext: any = {},
  features: any = { isEnabled: vi.fn(async () => true) },
  attachments: any = { isAvailable: vi.fn(async () => true) }
) =>
  new MailTemplateService(
    prisma as PrismaClient,
    mailContext as unknown as MailContext,
    letterContext as unknown as LetterContext,
    features as unknown as FeaturesService,
    attachments as DocumentAttachmentRenderer
  );

const mailVersion = {
  channel: MailChannel.mail,
  subject: 'Hi',
  htmlContent: '<p>Hi</p>',
  textContent: 'Hi',
};

const letterVersion = {
  channel: MailChannel.letter,
  subject: 'Ihre Rechnung',
  htmlContent: '<p>Guten Tag</p>',
  letterLayoutId: 'layout-1',
  letterAppendixId: 'doc-1',
};

describe('MailTemplateService', () => {
  describe('deleteMailTemplate', () => {
    const prismaWithCounts = (counts: {
      subscriptionIntervals: number;
      userFlowMails: number;
      mailLog: number;
    }) => ({
      mailTemplate: {
        findUnique: vi.fn(async () => ({ id: 't1', _count: counts })),
        delete: vi.fn(async () => undefined),
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

  describe('createMailTemplate', () => {
    const setup = (features?: any) => {
      const create = vi.fn(async (args: any) => ({ id: 't1', ...args.data }));
      const service = makeService(
        { mailTemplate: { create } },
        {},
        {},
        features
      );

      return { service, create };
    };

    it('stores the shared fields on the template and the words per channel', async () => {
      const { service, create } = setup();

      await service.createMailTemplate({
        name: 'Rechnung',
        description: 'Jährlich',
        context: MailTemplateContext.invoiceCreation,
        variants: [mailVersion, letterVersion],
      });

      expect(create).toHaveBeenCalledWith({
        data: {
          name: 'Rechnung',
          description: 'Jährlich',
          context: MailTemplateContext.invoiceCreation,
          variants: {
            create: [
              {
                channel: MailChannel.mail,
                subject: 'Hi',
                htmlContent: '<p>Hi</p>',
                textContent: 'Hi',
                sameAsMail: false,
                letterLayoutId: null,
                letterAppendixId: null,
              },
              {
                channel: MailChannel.letter,
                subject: 'Ihre Rechnung',
                htmlContent: '<p>Guten Tag</p>',
                textContent: null,
                sameAsMail: false,
                letterLayoutId: 'layout-1',
                letterAppendixId: 'doc-1',
              },
            ],
          },
        },
        include: {
          attachments: {
            select: { documentId: true },
            orderBy: { position: 'asc' },
          },
        },
      });
    });

    describe('a letter that says what the email says', () => {
      const sharedLetter = {
        channel: MailChannel.letter,
        subject: 'ignored',
        htmlContent: '<p>ignored</p>',
        sameAsMail: true,
        letterLayoutId: 'layout-1',
      };

      it('stores no words of its own, only its stationery', async () => {
        const { service, create } = setup();

        await service.createMailTemplate({
          name: 'Rechnung',
          variants: [mailVersion, sharedLetter],
        });

        expect(create.mock.calls[0][0].data.variants.create[1]).toEqual({
          channel: MailChannel.letter,
          subject: '',
          htmlContent: '',
          textContent: null,
          sameAsMail: true,
          letterLayoutId: 'layout-1',
          letterAppendixId: null,
        });
      });

      it('needs an email to take the words from', async () => {
        const { service, create } = setup();

        await expect(
          service.createMailTemplate({
            name: 'Brief',
            variants: [sharedLetter],
          })
        ).rejects.toThrow(BadRequestException);
        expect(create).not.toHaveBeenCalled();
      });

      it('is a thing of the letter: the email cannot point at itself', async () => {
        const { service } = setup();

        await expect(
          service.createMailTemplate({
            name: 'Mail',
            variants: [{ ...mailVersion, sameAsMail: true }],
          })
        ).rejects.toThrow(BadRequestException);
      });
    });

    it('accepts a template written as a letter only', async () => {
      const { service, create } = setup();

      await service.createMailTemplate({
        name: 'Begleitbrief',
        context: MailTemplateContext.custom,
        variants: [letterVersion],
      });

      expect(create.mock.calls[0][0].data.variants.create).toHaveLength(1);
    });

    it('refuses a template that says nothing on any channel', async () => {
      const { service, create } = setup();

      await expect(
        service.createMailTemplate({ name: 'Leer', variants: [] })
      ).rejects.toThrow(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it('refuses two versions for the same channel', async () => {
      const { service } = setup();

      await expect(
        service.createMailTemplate({
          name: 'Doppelt',
          variants: [mailVersion, mailVersion],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses a letter version while letters are switched off', async () => {
      const { service, create } = setup({
        isEnabled: vi.fn(async () => false),
      });

      await expect(
        service.createMailTemplate({
          name: 'Rechnung',
          variants: [mailVersion, letterVersion],
        })
      ).rejects.toThrow(ForbiddenException);
      expect(create).not.toHaveBeenCalled();
    });

    it.each([MailTemplateContext.account, MailTemplateContext.emailChange])(
      'refuses a letter version for a %s template: a link is no use on paper',
      async context => {
        const { service } = setup();

        await expect(
          service.createMailTemplate({
            name: 'Login',
            context,
            variants: [mailVersion, letterVersion],
          })
        ).rejects.toThrow(BadRequestException);
      }
    );
  });

  describe('updateMailTemplate', () => {
    const setup = (existingChannels: MailChannel[] = [MailChannel.mail]) => {
      const update = vi.fn(async (args: any) => ({ id: 't1', ...args.data }));
      const findMany = vi.fn(async () =>
        existingChannels.map(channel => ({ channel }))
      );
      const service = makeService({
        mailTemplate: { update },
        mailTemplateVariant: { findMany },
      });

      return { service, update };
    };

    it('writes the versions it is given and leaves the others alone', async () => {
      const { service, update } = setup([MailChannel.mail, MailChannel.letter]);

      await service.updateMailTemplate('t1', {
        name: 'Rechnung',
        context: MailTemplateContext.invoiceCreation,
        variants: [mailVersion],
      });

      const content = {
        channel: MailChannel.mail,
        subject: 'Hi',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
        sameAsMail: false,
        letterLayoutId: null,
        letterAppendixId: null,
      };

      expect(update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          name: 'Rechnung',
          description: null,
          context: MailTemplateContext.invoiceCreation,
          variants: {
            upsert: [
              {
                where: {
                  templateId_channel: {
                    templateId: 't1',
                    channel: MailChannel.mail,
                  },
                },
                create: content,
                update: content,
              },
            ],
          },
        },
        include: {
          attachments: {
            select: { documentId: true },
            orderBy: { position: 'asc' },
          },
        },
      });
    });

    it('lets a letter take the words of an email saved before', async () => {
      const { service, update } = setup([MailChannel.mail]);

      await service.updateMailTemplate('t1', {
        name: 'Rechnung',
        variants: [
          {
            channel: MailChannel.letter,
            subject: '',
            htmlContent: '',
            sameAsMail: true,
          },
        ],
      });

      expect(
        update.mock.calls[0][0].data.variants.upsert[0].create.sameAsMail
      ).toBe(true);
    });

    it('saves the shared fields alone when no version is handed in', async () => {
      const { service, update } = setup();

      await service.updateMailTemplate('t1', { name: 'Neu', variants: [] });

      expect(update.mock.calls[0][0].data.variants).toEqual({ upsert: [] });
    });

    it('refuses to turn a template with a letter version into a login mail', async () => {
      const { service, update } = setup([MailChannel.mail, MailChannel.letter]);

      await expect(
        service.updateMailTemplate('t1', {
          name: 'Login',
          context: MailTemplateContext.account,
          variants: [mailVersion],
        })
      ).rejects.toThrow(BadRequestException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('deleteMailTemplateVariant', () => {
    const setup = ({
      channels = [MailChannel.mail, MailChannel.letter],
      subscriptionIntervals = 0,
      userFlowMails = 0,
      letterIntervals = 0,
      letterSameAsMail = false,
    }: {
      letterSameAsMail?: boolean;
      channels?: MailChannel[];
      subscriptionIntervals?: number;
      userFlowMails?: number;
      letterIntervals?: number;
    } = {}) => {
      const remove = vi.fn(async () => undefined);
      const service = makeService({
        mailTemplate: {
          findUnique: vi.fn(async () => ({
            id: 't1',
            variants: channels.map(channel => ({
              channel,
              sameAsMail: channel === MailChannel.letter && letterSameAsMail,
            })),
            _count: { subscriptionIntervals, userFlowMails },
          })),
        },
        subscriptionInterval: { count: vi.fn(async () => letterIntervals) },
        mailTemplateVariant: { delete: remove },
      });

      return { service, remove };
    };

    it('removes a version nothing depends on', async () => {
      const { service, remove } = setup();

      await service.deleteMailTemplateVariant('t1', MailChannel.letter);

      expect(remove).toHaveBeenCalledWith({
        where: {
          templateId_channel: { templateId: 't1', channel: MailChannel.letter },
        },
      });
    });

    it('keeps the email while the letter takes its words from it', async () => {
      const { service, remove } = setup({ letterSameAsMail: true });

      await expect(
        service.deleteMailTemplateVariant('t1', MailChannel.mail)
      ).rejects.toThrow(BadRequestException);
      expect(remove).not.toHaveBeenCalled();
    });

    it('keeps the last version: a template has to say something', async () => {
      const { service, remove } = setup({ channels: [MailChannel.mail] });

      await expect(
        service.deleteMailTemplateVariant('t1', MailChannel.mail)
      ).rejects.toThrow(BadRequestException);
      expect(remove).not.toHaveBeenCalled();
    });

    it('refuses a version the template does not have', async () => {
      const { service } = setup({ channels: [MailChannel.mail] });

      await expect(
        service.deleteMailTemplateVariant('t1', MailChannel.letter)
      ).rejects.toThrow(BadRequestException);
    });

    it('keeps the email while a subscription flow sends the template', async () => {
      const { service, remove } = setup({ subscriptionIntervals: 1 });

      await expect(
        service.deleteMailTemplateVariant('t1', MailChannel.mail)
      ).rejects.toThrow(/subscription flow/);
      expect(remove).not.toHaveBeenCalled();
    });

    it('keeps the email while a system mail sends the template', async () => {
      const { service } = setup({ userFlowMails: 1 });

      await expect(
        service.deleteMailTemplateVariant('t1', MailChannel.mail)
      ).rejects.toThrow(/system mail/);
    });

    it('keeps the letter while an event is switched to letters with it', async () => {
      const { service, remove } = setup({
        subscriptionIntervals: 2,
        letterIntervals: 1,
      });

      await expect(
        service.deleteMailTemplateVariant('t1', MailChannel.letter)
      ).rejects.toThrow(/letter/);
      expect(remove).not.toHaveBeenCalled();
    });

    it('removes the letter of a template flows only mail', async () => {
      const { service, remove } = setup({ subscriptionIntervals: 2 });

      await service.deleteMailTemplateVariant('t1', MailChannel.letter);

      expect(remove).toHaveBeenCalled();
    });
  });

  describe('importFromProvider', () => {
    const makeImportService = (
      remoteTemplates: any[],
      existing: { id: string } | null = null
    ) => {
      const create = vi.fn(async (args: any) => args);
      const upsert = vi.fn(async (args: any) => args);
      const service = makeService(
        {
          mailTemplate: { findUnique: vi.fn(async () => existing), create },
          mailTemplateVariant: { upsert },
        },
        {
          mailProvider: { listTemplates: vi.fn(async () => remoteTemplates) },
        }
      );

      return { service, create, upsert };
    };

    it('creates a local template with an email version for every unknown remote one', async () => {
      const { service, create, upsert } = makeImportService([
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
      expect(create).toHaveBeenCalledTimes(2);
      expect(create).toHaveBeenCalledWith({
        data: {
          name: 'Welcome',
          externalMailTemplateId: 'welcome',
          variants: {
            create: {
              channel: MailChannel.mail,
              htmlContent: '<p>a</p>',
              subject: 'A',
            },
          },
        },
      });
      expect(upsert).not.toHaveBeenCalled();
    });

    it('overwrites the email version of a template imported before, and nothing else', async () => {
      const { service, create, upsert } = makeImportService(
        [
          {
            externalId: 'welcome',
            name: 'Welcome',
            html: '<p>a</p>',
            subject: 'A',
          },
        ],
        { id: 't1' }
      );

      await expect(service.importFromProvider()).resolves.toBe(1);
      expect(create).not.toHaveBeenCalled();
      expect(upsert).toHaveBeenCalledWith({
        where: {
          templateId_channel: { templateId: 't1', channel: MailChannel.mail },
        },
        create: {
          templateId: 't1',
          channel: MailChannel.mail,
          htmlContent: '<p>a</p>',
          subject: 'A',
        },
        update: { htmlContent: '<p>a</p>', subject: 'A' },
      });
    });

    it('converts mandrill merge tags in html and subject', async () => {
      const { service, create } = makeImportService([
        {
          externalId: 'welcome',
          name: 'Welcome',
          html: '<p>Hi *|USER_FIRSTNAME|*</p>',
          subject: 'Hello *|USER_NAME|*',
        },
      ]);

      await service.importFromProvider();

      expect(create.mock.calls[0][0].data.variants.create).toMatchObject({
        htmlContent: '<p>Hi {{USER_FIRSTNAME}}</p>',
        subject: 'Hello {{USER_NAME}}',
      });
    });

    it('keeps the local subject when the provider has none', async () => {
      const { service, upsert } = makeImportService(
        [{ externalId: 'plain', name: 'Plain', html: '<p>a</p>' }],
        { id: 't1' }
      );

      await service.importFromProvider();

      expect(upsert.mock.calls[0][0].update).toEqual({
        htmlContent: '<p>a</p>',
      });
      expect(upsert.mock.calls[0][0].create.subject).toBe('');
    });

    it('imports nothing for a provider without a remote template store', async () => {
      const { service, create, upsert } = makeImportService([]);

      await expect(service.importFromProvider()).resolves.toBe(0);
      expect(create).not.toHaveBeenCalled();
      expect(upsert).not.toHaveBeenCalled();
    });

    it('surfaces a provider failure instead of reporting zero imports', async () => {
      const service = makeService(
        {},
        {
          mailProvider: {
            listTemplates: vi.fn(async () => {
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

  describe('attachments', () => {
    const input = {
      name: 'Vertrag',
      variants: [
        {
          channel: MailChannel.mail,
          subject: 'Ihr Vertrag',
          htmlContent: '<p>Hallo</p>',
        },
      ],
    };

    // What a save stores besides the attachments; the versions are covered by
    // the tests of saving versions.
    const dataOf = (call: { mock: { calls: any[][] } }) =>
      call.mock.calls[0][0].data;

    const docx = (id: string, title: string, fileSize = 20_000) => ({
      id,
      title,
      mimeType: DOCX_MIME_TYPE,
      fileSize,
    });

    const documents = [
      docx('contract', 'Vertrag'),
      docx('terms', 'AGB'),
      { id: 'flyer', title: 'Flyer', mimeType: 'application/pdf', fileSize: 1 },
      ...Array.from({ length: MAX_TEMPLATE_ATTACHMENTS + 1 }, (_, index) =>
        docx(`d${index}`, `Dokument ${index}`)
      ),
      docx('big', 'Katalog', MAX_ATTACHMENT_BYTES / 2 + 1),
      docx('bigger', 'Preisliste', MAX_ATTACHMENT_BYTES / 2 + 1),
    ];

    const prismaMock = ({ systemMail = null as string | null } = {}) => ({
      mailTemplate: {
        create: vi.fn(async () => ({ id: 't1' })),
        update: vi.fn(async () => ({ id: 't1' })),
      },
      mailTemplateVariant: {
        findMany: vi.fn(async () => [{ channel: MailChannel.mail }]),
      },
      document: {
        findMany: vi.fn(async ({ where }: any) =>
          documents.filter(({ id }) => where.id.in.includes(id))
        ),
      },
      userFlowMail: {
        findFirst: vi.fn(async () =>
          systemMail ? { event: systemMail } : null
        ),
      },
    });

    const ordered = {
      include: {
        attachments: {
          select: { documentId: true },
          orderBy: { position: 'asc' },
        },
      },
    };

    it('creates a template with its attachments in the order given', async () => {
      const prisma = prismaMock();

      await makeService(prisma).createMailTemplate({
        ...input,
        attachmentIds: ['terms', 'contract'],
      });

      expect(prisma.mailTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining(ordered)
      );
      expect(dataOf(prisma.mailTemplate.create).attachments).toEqual({
        create: [
          { documentId: 'terms', position: 0 },
          { documentId: 'contract', position: 1 },
        ],
      });
    });

    it('creates a template without attachments as before', async () => {
      const prisma = prismaMock();

      await makeService(prisma).createMailTemplate(input);

      expect(prisma.mailTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining(ordered)
      );
      expect(dataOf(prisma.mailTemplate.create)).not.toHaveProperty(
        'attachments'
      );
      expect(prisma.document.findMany).not.toHaveBeenCalled();
    });

    it('replaces the attachments of a template it updates', async () => {
      const prisma = prismaMock();

      await makeService(prisma).updateMailTemplate('t1', {
        ...input,
        attachmentIds: ['contract'],
      });

      expect(prisma.mailTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't1' }, ...ordered })
      );
      expect(dataOf(prisma.mailTemplate.update).attachments).toEqual({
        deleteMany: {},
        create: [{ documentId: 'contract', position: 0 }],
      });
    });

    it('removes every attachment for an empty list', async () => {
      // Also once attachments are gone, and on a system mail.
      const prisma = prismaMock({ systemMail: 'LOGIN_LINK' });
      const attachments = { isAvailable: vi.fn(async () => false) };

      await makeService(
        prisma,
        {},
        {},
        undefined,
        attachments
      ).updateMailTemplate('t1', {
        ...input,
        attachmentIds: [],
      });

      expect(dataOf(prisma.mailTemplate.update).attachments).toEqual({
        deleteMany: {},
        create: [],
      });
    });

    it('keeps the attachments of a template updated without a list', async () => {
      const prisma = prismaMock();

      await makeService(prisma).updateMailTemplate('t1', input);

      expect(prisma.mailTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't1' }, ...ordered })
      );
      expect(dataOf(prisma.mailTemplate.update)).not.toHaveProperty(
        'attachments'
      );
    });

    // Attachments ship dark with the letters, and only a renderer that
    // converts Word documents (Gotenberg) can render them; saving them where
    // they cannot be rendered would fail every mail of the template.
    it('refuses attachments where they cannot be rendered', async () => {
      const prisma = prismaMock();
      const attachments = { isAvailable: vi.fn(async () => false) };

      await expect(
        makeService(prisma, {}, {}, undefined, attachments).createMailTemplate({
          ...input,
          attachmentIds: ['contract'],
        })
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.mailTemplate.create).not.toHaveBeenCalled();
    });

    // A login link would otherwise wait for a document conversion.
    it('refuses attachments on a template sent as a system mail', async () => {
      const prisma = prismaMock({ systemMail: 'LOGIN_LINK' });

      await expect(
        makeService(prisma).updateMailTemplate('t1', {
          ...input,
          attachmentIds: ['contract'],
        })
      ).rejects.toThrow(/system mail LOGIN_LINK/);
      expect(prisma.userFlowMail.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { mailTemplateId: 't1' } })
      );
      expect(prisma.mailTemplate.update).not.toHaveBeenCalled();
    });

    it(`refuses more than ${MAX_TEMPLATE_ATTACHMENTS} documents`, async () => {
      const prisma = prismaMock();

      await expect(
        makeService(prisma).createMailTemplate({
          ...input,
          attachmentIds: Array.from(
            { length: MAX_TEMPLATE_ATTACHMENTS + 1 },
            (_, index) => `d${index}`
          ),
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mailTemplate.create).not.toHaveBeenCalled();
    });

    it('refuses documents too large together for a mail to carry', async () => {
      const prisma = prismaMock();

      await expect(
        makeService(prisma).createMailTemplate({
          ...input,
          attachmentIds: ['big', 'bigger'],
        })
      ).rejects.toThrow(/too large/);
      expect(prisma.mailTemplate.create).not.toHaveBeenCalled();
    });

    it('refuses a document that is not a Word document', async () => {
      const prisma = prismaMock();

      await expect(
        makeService(prisma).createMailTemplate({
          ...input,
          attachmentIds: ['flyer'],
        })
      ).rejects.toThrow(/"Flyer" is not a Word document/);
      expect(prisma.mailTemplate.create).not.toHaveBeenCalled();
    });

    it('refuses a document that does not exist', async () => {
      const prisma = prismaMock();

      await expect(
        makeService(prisma).updateMailTemplate('t1', {
          ...input,
          attachmentIds: ['gone'],
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mailTemplate.update).not.toHaveBeenCalled();
    });

    it('refuses the same document twice', async () => {
      const prisma = prismaMock();

      await expect(
        makeService(prisma).createMailTemplate({
          ...input,
          attachmentIds: ['contract', 'contract'],
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('isLetterChannelAvailable', () => {
    it.each([true, false])(
      'reports whether letters are configured (%s)',
      async configured => {
        const service = makeService(
          {},
          {},
          { isConfigured: async () => configured }
        );

        expect(await service.isLetterChannelAvailable()).toBe(configured);
      }
    );
  });

  describe('previewLetter', () => {
    const renderLetter = () =>
      vi.fn(async () => Buffer.from('%PDF-1.4 letter'));
    const resolveLayout = vi.fn(async () => null);

    it('previews the chosen appendix with the letter', async () => {
      const render = renderLetter();
      const service = makeService(
        {},
        {},
        { renderLetter: render, resolveLayout }
      );

      await service.previewLetter({
        contextId: 'renewal',
        subscriptionId: null,
        html: '<p>Hallo</p>',
        letterAppendixId: 'qr-bill',
      });

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          template: {
            htmlContent: '<p>Hallo</p>',
            letterAppendixId: 'qr-bill',
          },
        })
      );
    });

    it('prints the attachments chosen on the draft', async () => {
      const render = renderLetter();
      const service = makeService(
        {},
        {},
        { renderLetter: render, resolveLayout }
      );

      await service.previewLetter({
        contextId: 'renewal',
        subscriptionId: null,
        html: '<p>Hallo</p>',
        attachmentIds: ['contract'],
      });

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          template: expect.objectContaining({ attachmentIds: ['contract'] }),
        })
      );
    });

    it('renders the draft with sample data and a sample address', async () => {
      const render = renderLetter();
      const service = makeService(
        {},
        {},
        { renderLetter: render, resolveLayout }
      );

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
          findUnique: vi.fn(async () => ({ id: 's1', user })),
        },
        invoice: { findFirst: vi.fn(async () => null) },
      };
      const service = makeService(
        prisma,
        {},
        { renderLetter: render, resolveLayout }
      );

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

    it('prints the draft on the stationery the editor chose', async () => {
      const render = renderLetter();
      const layout = { headerHtml: '<b>Zwölf</b>' };
      const resolveLayout = vi.fn(async () => layout);
      const service = makeService(
        {},
        {},
        { renderLetter: render, resolveLayout }
      );

      await service.previewLetter({
        contextId: 'renewal',
        subscriptionId: null,
        html: '<p>Hallo</p>',
        letterLayoutId: 'layout-1',
      });

      expect(resolveLayout).toHaveBeenCalledWith('layout-1');
      expect(render).toHaveBeenCalledWith(expect.objectContaining({ layout }));
    });

    it('prints the draft on the default stationery when none is chosen', async () => {
      const render = renderLetter();
      const resolveLayout = vi.fn(async () => null);
      const service = makeService(
        {},
        {},
        { renderLetter: render, resolveLayout }
      );

      await service.previewLetter({
        contextId: 'renewal',
        subscriptionId: null,
        html: '<p>Hallo</p>',
      });

      expect(resolveLayout).toHaveBeenCalledWith(undefined);
      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({ layout: null })
      );
    });

    it('refuses a subscription whose user has no usable address', async () => {
      const render = renderLetter();
      const prisma = {
        subscription: {
          findUnique: vi.fn(async () => ({
            id: 's1',
            user: { id: 'u1', email: 'max@example.com', address: null },
          })),
        },
        invoice: { findFirst: vi.fn(async () => null) },
      };
      const service = makeService(
        prisma,
        {},
        { renderLetter: render, resolveLayout }
      );

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

  describe('sendTest', () => {
    it('logs the test mail under a uuidv7', async () => {
      const mailContext = {
        jwtGenerator: vi.fn(async () => 'jwt'),
        sendComposedContent: vi.fn(async () => undefined),
      };

      await makeService({}, mailContext).sendTest({
        contextId: 'renewal',
        subscriptionId: null,
        currentUserId: 'u1',
        recipient: 'test@wepublish.ch',
        subject: 'Hi',
        html: '<p>Hi</p>',
      });

      const [{ mailLogID }] = mailContext.sendComposedContent.mock
        .calls[0] as any;
      expect(version(mailLogID)).toBe(7);
    });

    it('attaches the documents chosen on the draft', async () => {
      const mailContext = {
        jwtGenerator: vi.fn(async () => 'jwt'),
        sendComposedContent: vi.fn(async () => undefined),
      };

      await makeService({}, mailContext).sendTest({
        contextId: 'renewal',
        subscriptionId: null,
        currentUserId: 'u1',
        recipient: 'test@wepublish.ch',
        subject: 'Hi',
        html: '<p>Hi</p>',
        attachmentIds: ['contract'],
      });

      expect(mailContext.sendComposedContent).toHaveBeenCalledWith(
        expect.objectContaining({ attachmentIds: ['contract'] })
      );
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
