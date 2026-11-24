import { MailProviderTransientError } from './mail-provider.interface';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { SmtpMailProvider } from './smtp-mail-provider';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail }),
}));

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  sendMail.mockReset();
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

const makeProvider = async () => {
  const testing = await createNamespacedCacheTesting();
  harnesses.push(testing);

  await testing.cache.setNs(
    'settings:mailprovider',
    'smtp',
    { id: 'smtp', type: 'smtp', name: 'SMTP', fromAddress: 'dev@wepublish.ch' },
    60
  );

  return new SmtpMailProvider({
    id: 'smtp',
    kv: testing.cache,
    prisma: {} as never,
  });
};

const sendProps = {
  mailLogID: 'log-1',
  recipient: 'user@example.com',
  replyToAddress: 'reply@wepublish.ch',
  subject: 'Ihr Vertrag',
  message: 'Hallo',
  messageHtml: '<p>Hallo</p>',
};

describe('SmtpMailProvider', () => {
  it('hands the composed mail to the SMTP server', async () => {
    await (await makeProvider()).sendMail(sendProps);

    expect(sendMail).toHaveBeenCalledWith({
      from: 'dev@wepublish.ch',
      to: 'user@example.com',
      replyTo: 'reply@wepublish.ch',
      subject: 'Ihr Vertrag',
      text: 'Hallo',
      html: '<p>Hallo</p>',
    });
  });

  it('sends the attachments along', async () => {
    const content = Buffer.from('%PDF-1.7');

    await (
      await makeProvider()
    ).sendMail({
      ...sendProps,
      attachments: [
        { filename: 'Vertrag.pdf', contentType: 'application/pdf', content },
      ],
    });

    expect(sendMail.mock.calls[0][0].attachments).toEqual([
      { filename: 'Vertrag.pdf', contentType: 'application/pdf', content },
    ]);
  });

  describe('a temporary failure', () => {
    const smtpError = (message: string, fields: Record<string, unknown>) =>
      Object.assign(new Error(message), fields);

    it.each([
      [
        'the server rate-limits',
        smtpError(
          "Can't send mail - all recipients were rejected: 429 Rate limited",
          { code: 'EENVELOPE', responseCode: 429 }
        ),
      ],
      [
        'the server is busy',
        smtpError('421 Service not available', { responseCode: 421 }),
      ],
      [
        'the mailbox is busy',
        smtpError('451 Try again later', { responseCode: 451 }),
      ],
      [
        'the connection fails',
        smtpError('Connection timeout', { code: 'ETIMEDOUT' }),
      ],
      [
        'the connection drops',
        smtpError('Connection closed', { code: 'ECONNECTION' }),
      ],
    ])('is worth another try when %s', async (_, error) => {
      sendMail.mockRejectedValue(error);

      const thrown = await (
        await makeProvider()
      )
        .sendMail(sendProps)
        .catch((e: Error) => e);

      expect(thrown).toBeInstanceOf(MailProviderTransientError);
      expect(thrown.message).toContain(error.message);
    });

    it('is not when the server refuses for good', async () => {
      const refused = smtpError('550 Mailbox unavailable', {
        code: 'EENVELOPE',
        responseCode: 550,
      });
      sendMail.mockRejectedValue(refused);

      await expect((await makeProvider()).sendMail(sendProps)).rejects.toBe(
        refused
      );
    });
  });
});
