import { MailContext, SendComposedMailProps } from './mail-context';
import { MailController, mailLogType } from './mail.controller';

/** What the controller hands to the composer for a mail of this type. */
async function composedAs(mailType: mailLogType) {
  const sendComposedMail = vi.fn(async (_props: SendComposedMailProps) => ({
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
    recipient: { id: 'user-1', email: 'jane@example.com' } as any,
    optionalData: {},
    mailType,
  }).sendMail();

  return sendComposedMail.mock.calls[0][0];
}

describe('MailController attachments', () => {
  // Login links, password resets and the other account mails go out while
  // someone waits for them; they must not depend on a document conversion.
  it.each([
    ['account mails', mailLogType.UserFlow],
    ['tests of account mails', mailLogType.SystemMail],
  ])('sends %s without attachments', async (_name, mailType) => {
    expect(await composedAs(mailType)).toMatchObject({
      withAttachments: false,
    });
  });

  it.each([
    ['subscription mails', mailLogType.SubscriptionFlow],
    ['mails sent by hand', mailLogType.Manual],
  ])('sends %s with their attachments', async (_name, mailType) => {
    expect(await composedAs(mailType)).toMatchObject({
      withAttachments: true,
    });
  });
});
