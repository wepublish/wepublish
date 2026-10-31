import { MailContext } from './mail-context';
import { MailController, mailLogType } from './mail.controller';

const secrets = {
  password: 'hash',
  roleIDs: ['admin'],
  totpSecret: 'secret',
  totpEnabled: true,
  totpExempt: false,
};

const recipient = {
  id: 'user-1',
  email: 'jane@example.com',
  firstName: 'Jane',
  name: 'Doe',
  ...secrets,
} as any;

/** The data the composed mail is rendered with. */
async function templateData(optionalData: Record<string, any>) {
  const sendComposedMail = vi.fn(async () => ({
    subject: 'S',
    providerMessageID: 'msg-1',
  }));
  const mailContext = {
    mailProvider: { id: 'mailgun' },
    jwtGenerator: vi.fn(async () => 'jwt-1'),
    sendComposedMail,
  } as unknown as MailContext;
  const prisma = {
    mailLog: { count: vi.fn(async () => 0), create: vi.fn() },
  } as any;

  await new MailController(prisma, mailContext, {
    mailTemplateId: 'template-1',
    recipient,
    optionalData,
    mailType: mailLogType.SubscriptionFlow,
  }).sendMail();

  return sendComposedMail.mock.calls[0][0].data;
}

describe('MailController template data', () => {
  it('strips the secrets off the recipient', async () => {
    const data = await templateData({});

    expect(data.user).toEqual({
      id: 'user-1',
      email: 'jane@example.com',
      firstName: 'Jane',
      name: 'Doe',
    });
  });

  // The nightly job hands the subscription in with its user relation.
  it('strips the secrets off users nested in the optional data', async () => {
    const data = await templateData({
      subscriptionToCreateInvoice: {
        id: 'sub-1',
        user: { id: 'user-1', name: 'Doe', ...secrets },
      },
      invoice: { id: 'inv-1' },
    });

    expect(data.optional.subscriptionToCreateInvoice.user).toEqual({
      id: 'user-1',
      name: 'Doe',
    });
    expect(data.optional.invoice).toEqual({ id: 'inv-1' });
  });

  it('keeps dates, arrays and buffers in the optional data as they are', async () => {
    const dueAt = new Date('2026-12-17T00:00:00.000Z');
    const pdf = Buffer.from('pdf');
    const data = await templateData({
      invoice: { dueAt, items: [{ amount: 100 }], pdf },
    });

    expect(data.optional.invoice.dueAt).toBe(dueAt);
    expect(data.optional.invoice.items).toEqual([{ amount: 100 }]);
    expect(data.optional.invoice.pdf).toBe(pdf);
  });

  it('leaves the data the caller handed in untouched', async () => {
    const optionalData = { user: { id: 'user-1', ...secrets } };

    await templateData(optionalData);

    expect(optionalData.user.password).toBe('hash');
  });
});
