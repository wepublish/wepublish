import { PrismaClient } from '@prisma/client';
import { MailContext } from './mail-context';
import { EMPTY_PURL_DATA } from './mail-data';
import {
  MailAttachment,
  MailAttachmentError,
  MailAttachmentRenderer,
} from './mail-attachment';
import {
  MailProviderError,
  MailProviderRecipientError,
  MailProviderTransientError,
} from './mail-provider/mail-provider.interface';

const createContext = (prisma: unknown) =>
  new MailContext({
    prisma: prisma as PrismaClient,
    mailProvider: {} as any,
    kv: {} as any,
    jwtGenerator: async () => '',
  });

const createPrismaMock = () => ({
  subscriptionInterval: {
    findMany: vi.fn((_args?: Record<string, unknown>) => [
      { mailTemplateId: 'renewal-success' },
      { mailTemplateId: null },
    ]),
  },
  userFlowMail: {
    findMany: vi.fn((_args?: Record<string, unknown>) => [
      { mailTemplateId: 'login-link' },
      { mailTemplateId: null },
    ]),
  },
});

describe('MailContext', () => {
  describe('getUsedTemplateIdentifiers', () => {
    it('includes templates from subscription intervals and user flow mails', async () => {
      const prismaMock = createPrismaMock();

      const result =
        await createContext(prismaMock).getUsedTemplateIdentifiers();

      expect(result).toEqual(['renewal-success', 'login-link']);
    });

    // Only the template id is ever read here. Joining the template in pulled
    // every `htmlContent`/`textContent` blob across for nothing.
    it('reads only the template id, without joining the template', async () => {
      const prismaMock = createPrismaMock();

      await createContext(prismaMock).getUsedTemplateIdentifiers();

      for (const { findMany } of [
        prismaMock.subscriptionInterval,
        prismaMock.userFlowMail,
      ]) {
        const args = findMany.mock.calls[0]?.[0];

        expect(args).toBeDefined();
        expect(args).toHaveProperty('select', { mailTemplateId: true });
        expect(args).not.toHaveProperty('include');
      }
    });
  });

  describe('buildMailData', () => {
    it('keeps the login link (jwt) while personal login codes are switched off', async () => {
      const context = new MailContext({
        prisma: {} as PrismaClient,
        mailProvider: {} as any,
        kv: {} as any,
        jwtGenerator: async userId => `jwt-for-${userId}`,
        // What the login code service hands out while the medium has them off.
        purlProvider: { purlFor: async () => EMPTY_PURL_DATA },
      });

      const data = await context.buildMailData({
        recipient: { id: 'user-1' },
        optionalData: {},
        mode: 'send',
      });

      expect(data.jwt).toBe('jwt-for-user-1');
      expect(data.purl).toBe('');
      expect(data.purlCode).toBe('');
    });

    it('issues no login code for a mail that does not show one', async () => {
      const purlFor = vi.fn();
      const context = new MailContext({
        prisma: {} as PrismaClient,
        mailProvider: {} as any,
        kv: {} as any,
        jwtGenerator: async () => '',
        purlProvider: { purlFor },
      });

      const data = await context.buildMailData({
        recipient: { id: 'user-1' },
        optionalData: {},
        mode: 'send',
        mintPurl: false,
      });

      expect(purlFor).not.toHaveBeenCalled();
      expect(data.purl).toBe('');
      expect(data.purlCode).toBe('');
      expect(data.purlQr).toBe('');
    });
  });

  describe('attachments', () => {
    const pdf = (name: string): MailAttachment => ({
      filename: `${name}.pdf`,
      contentType: 'application/pdf',
      content: Buffer.from(`%PDF-${name}`),
    });

    const data = { user: { firstName: 'Jane' } };

    const renderPdfs = () => vi.fn(async (ids: string[]) => ids.map(pdf));

    function setup({
      attachments = [] as string[],
      renderer = { render: renderPdfs() } as MailAttachmentRenderer | null,
    } = {}) {
      const sendMail = vi.fn().mockResolvedValue({ providerMessageID: 'm-1' });
      // The words are the email version's, the attachments the template's.
      const variant = {
        id: 'variant-1',
        templateId: 'template-1',
        channel: 'mail',
        subject: 'Hallo {{user_firstName}}',
        htmlContent: '<p>Hallo {{user_firstName}}</p>',
        textContent: null,
      };
      const findUnique = vi.fn().mockResolvedValue({
        attachments: attachments.map(documentId => ({ documentId })),
      });

      const context = new MailContext({
        prisma: {
          mailTemplate: { findUnique },
          mailTemplateVariant: { findUnique: vi.fn(async () => variant) },
        } as unknown as PrismaClient,
        mailProvider: { id: 'smtp', sendMail } as any,
        kv: {
          getOrLoadNs: vi.fn().mockResolvedValue({ fromAddress: 'a@b.ch' }),
        } as any,
        jwtGenerator: async () => '',
        attachmentRenderer: renderer ?? undefined,
      });

      return { context, sendMail, findUnique };
    }

    const send = (context: MailContext) =>
      context.sendComposedMail({
        mailTemplateId: 'template-1',
        recipient: 'jane@example.com',
        mailLogID: 'log-1',
        data,
      });

    it('attaches the documents of the template, filled in with the mail data', async () => {
      const render = renderPdfs();
      const { context, sendMail } = setup({
        attachments: ['contract', 'terms'],
        renderer: { render },
      });

      await send(context);

      expect(render).toHaveBeenCalledWith(['contract', 'terms'], data);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Hallo Jane',
          attachments: [pdf('contract'), pdf('terms')],
        })
      );
    });

    it('reads the attachments in the order they were put on the template', async () => {
      const { context, findUnique } = setup();

      await send(context);

      expect(findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            attachments: {
              select: { documentId: true },
              orderBy: { position: 'asc' },
            },
          },
        })
      );
    });

    it('sends a template without attachments as before', async () => {
      const render = renderPdfs();
      const { context, sendMail } = setup({ renderer: { render } });

      await send(context);

      expect(render).not.toHaveBeenCalled();
      expect(sendMail.mock.calls[0][0]).not.toHaveProperty('attachments');
    });

    it('does not send the mail when an attachment cannot be rendered', async () => {
      const { context, sendMail } = setup({
        attachments: ['contract'],
        renderer: {
          render: vi.fn().mockRejectedValue(new Error('Gotenberg is down')),
        },
      });

      const error = await send(context).catch(e => e);

      // Its own kind, so a nightly run can skip this mail and go on.
      expect(error).toBeInstanceOf(MailAttachmentError);
      expect(error.message).toBe('Gotenberg is down');
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('leaves the attachments out of a mail sent without them', async () => {
      // Login and password mails must never wait for a document conversion.
      const render = renderPdfs();
      const { context, sendMail } = setup({
        attachments: ['contract'],
        renderer: { render },
      });

      await context.sendComposedMail({
        mailTemplateId: 'template-1',
        recipient: 'jane@example.com',
        mailLogID: 'log-1',
        data,
        withAttachments: false,
      });

      expect(render).not.toHaveBeenCalled();
      expect(sendMail.mock.calls[0][0]).not.toHaveProperty('attachments');
    });

    it("appends the caller's files after the template's documents", async () => {
      const { context, sendMail } = setup({ attachments: ['contract'] });

      await context.sendComposedMail({
        mailTemplateId: 'template-1',
        recipient: 'jane@example.com',
        mailLogID: 'log-1',
        data,
        attachments: [pdf('invoice')],
      });

      expect(sendMail.mock.calls[0][0].attachments).toEqual([
        pdf('contract'),
        pdf('invoice'),
      ]);
    });

    it("sends the caller's files without needing a renderer", async () => {
      // The provider's invoice pdf is ready-made; nothing has to be converted.
      const { context, sendMail } = setup({ renderer: null });

      await context.sendComposedMail({
        mailTemplateId: 'template-1',
        recipient: 'jane@example.com',
        mailLogID: 'log-1',
        data,
        attachments: [pdf('invoice')],
      });

      expect(sendMail.mock.calls[0][0].attachments).toEqual([pdf('invoice')]);
    });

    it('does not send attachments it has no renderer for', async () => {
      const { context, sendMail } = setup({
        attachments: ['contract'],
        renderer: null,
      });

      await expect(send(context)).rejects.toBeInstanceOf(MailAttachmentError);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('attaches the documents of a draft to its test mail', async () => {
      const render = renderPdfs();
      const { context, sendMail } = setup({ renderer: { render } });

      await context.sendComposedContent({
        content: { subject: 'Test', htmlContent: '<p>Test</p>' },
        attachmentIds: ['contract'],
        recipient: 'editor@example.com',
        mailLogID: 'log-1',
        data,
      });

      expect(render).toHaveBeenCalledWith(['contract'], data);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ attachments: [pdf('contract')] })
      );
    });
  });

  describe('a mail provider that fails for a moment', () => {
    const setup = (sendMail: ReturnType<typeof vi.fn>) =>
      new MailContext({
        prisma: {
          mailTemplate: {
            findUnique: vi.fn().mockResolvedValue({ attachments: [] }),
          },
          mailTemplateVariant: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'variant-1',
              templateId: 'template-1',
              channel: 'mail',
              subject: 'Rechnung',
              htmlContent: '<p>Rechnung</p>',
              textContent: null,
            }),
          },
        } as unknown as PrismaClient,
        mailProvider: { id: 'mandrill', sendMail } as any,
        kv: { getOrLoadNs: vi.fn().mockResolvedValue({}) } as any,
        jwtGenerator: async () => '',
        sendRetryDelaysMs: [0, 0, 0],
      });

    const send = (context: MailContext) =>
      context.sendComposedMail({
        mailTemplateId: 'template-1',
        recipient: 'jane@example.com',
        mailLogID: 'log-1',
        data: {},
      });

    it('tries again, so one hiccup does not stop a whole renewal run', async () => {
      const sendMail = vi
        .fn()
        .mockRejectedValueOnce(new MailProviderTransientError('503'))
        .mockResolvedValue({ providerMessageID: 'm-1' });

      await expect(send(setup(sendMail))).resolves.toEqual({
        subject: 'Rechnung',
        providerMessageID: 'm-1',
      });
      expect(sendMail).toHaveBeenCalledTimes(2);
    });

    it("gives up after three more attempts with the provider's error", async () => {
      const sendMail = vi
        .fn()
        .mockRejectedValue(new MailProviderTransientError('Mandrill down'));

      await expect(send(setup(sendMail))).rejects.toThrow('Mandrill down');
      expect(sendMail).toHaveBeenCalledTimes(4);
    });

    it.each([
      ['a refused recipient', new MailProviderRecipientError('hard-bounce')],
      ['a provider error that is not temporary', new MailProviderError('401')],
      ['an unknown error', new Error('boom')],
    ])('does not try again after %s', async (_, error) => {
      const sendMail = vi.fn().mockRejectedValue(error);

      await expect(send(setup(sendMail))).rejects.toBe(error);
      expect(sendMail).toHaveBeenCalledTimes(1);
    });
  });
});

describe('MailContext.sendComposedMail', () => {
  const setup = (variant: Record<string, unknown> | null) => {
    const sendMail = vi.fn(async () => ({ providerMessageID: 'msg-1' }));
    const prisma = {
      mailTemplate: { findUnique: vi.fn(async () => ({ attachments: [] })) },
      mailTemplateVariant: { findUnique: vi.fn(async () => variant) },
    };
    const context = new MailContext({
      prisma: prisma as unknown as PrismaClient,
      mailProvider: { id: 'mailgun', sendMail } as any,
      kv: { getOrLoadNs: vi.fn(async () => null) } as any,
      jwtGenerator: async () => '',
    });

    return { context, prisma, sendMail };
  };

  const props = {
    mailTemplateId: 'template-1',
    recipient: 'jane@example.com',
    data: { user: { firstName: 'Jane' } },
    mailLogID: 'log-1',
  };

  it('sends what the template says by email', async () => {
    const { context, prisma, sendMail } = setup({
      subject: 'Hello {{user_firstName}}',
      htmlContent: '<p>Hi {{user_firstName}}</p>',
      textContent: null,
    });

    await expect(context.sendComposedMail(props)).resolves.toEqual({
      subject: 'Hello Jane',
      providerMessageID: 'msg-1',
    });
    expect(prisma.mailTemplateVariant.findUnique).toHaveBeenCalledWith({
      where: {
        templateId_channel: { templateId: 'template-1', channel: 'mail' },
      },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Hello Jane',
        messageHtml: expect.stringContaining('Hi Jane'),
      })
    );
  });

  it('refuses a template that was only written as a letter', async () => {
    const { context, sendMail } = setup(null);

    await expect(context.sendComposedMail(props)).rejects.toThrow(
      'MailTemplate <template-1> has no mail version!'
    );
    expect(sendMail).not.toHaveBeenCalled();
  });
});
