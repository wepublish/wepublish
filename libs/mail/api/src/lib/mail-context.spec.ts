import { PrismaClient } from '@prisma/client';
import { MailContext } from './mail-context';
import { EMPTY_PURL_DATA } from './mail-data';
import {
  MailAttachment,
  MailAttachmentError,
  MailAttachmentRenderer,
} from './mail-attachment';

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
      const findUnique = vi.fn().mockResolvedValue({
        id: 'template-1',
        subject: 'Hallo {{user_firstName}}',
        htmlContent: '<p>Hallo {{user_firstName}}</p>',
        textContent: null,
        attachments: attachments.map(documentId => ({ documentId })),
      });

      const context = new MailContext({
        prisma: { mailTemplate: { findUnique } } as unknown as PrismaClient,
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
          include: {
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
});
