import { MailLogType, PrismaClient, User } from '@prisma/client';
import { MailContext } from './mail-context';
import { MailController, mailLogType } from './mail.controller';

const recipient = { id: 'user-1', email: 'jane@example.com' } as User;

async function loggedType(mailType: mailLogType) {
  const mailContext = {
    mailProvider: { id: 'mailgun' },
    isPlaceholderEmail: vi.fn(async () => false),
    buildMailData: vi.fn(async () => ({ jwt: 'jwt-1' })),
    sendComposedMail: vi.fn(async () => ({ subject: 'S' })),
  } as unknown as MailContext;
  const create = vi.fn();
  const prisma = {
    mailLog: { count: vi.fn(async () => 0), create },
    mailTemplate: { findUnique: vi.fn(async () => null) },
  } as unknown as PrismaClient;

  await new MailController(prisma, mailContext, {
    mailTemplateId: 'template-1',
    recipient,
    optionalData: {},
    mailType,
  }).sendMail();

  return create.mock.calls[0][0].data.type;
}

describe('MailController log type', () => {
  it('logs a gift code mail as such', async () => {
    expect(await loggedType(mailLogType.GiftCode)).toBe(MailLogType.giftCode);
  });

  it('keeps logging subscription flow mails as before', async () => {
    expect(await loggedType(mailLogType.SubscriptionFlow)).toBe(
      MailLogType.subscriptionFlow
    );
  });
});
