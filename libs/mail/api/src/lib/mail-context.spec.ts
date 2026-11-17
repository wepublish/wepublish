import { PrismaClient } from '@prisma/client';
import { MailContext } from './mail-context';

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
});

describe('MailContext.sendComposedMail', () => {
  const setup = (variant: Record<string, unknown> | null) => {
    const sendMail = vi.fn(async () => ({ providerMessageID: 'msg-1' }));
    const prisma = {
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
