import { EmailQualityEventType } from '@prisma/client';
import { MailController, mailLogType } from './mail.controller';
import {
  MailProviderError,
  MailProviderRecipientError,
} from './mail-provider/mail-provider.interface';

const recipient = { id: 'user-1', email: 'jane@example.com' } as any;

/** The parts of the context a send touches before the provider answers. */
const contextFor = (error: Error, emailQualityRecorder: unknown) => ({
  sendComposedMail: vi.fn(async () => {
    throw error;
  }),
  jwtGenerator: vi.fn(async () => 'jwt'),
  isPlaceholderEmail: vi.fn(async () => false),
  buildMailData: vi.fn(async () => ({
    user: recipient,
    optional: {},
    jwt: 'jwt',
    currentDate: new Date(),
  })),
  mailProvider: { id: 'mailchimp' },
  emailQualityRecorder,
});

const prismaFor = () => ({
  mailLog: { create: vi.fn(async () => ({})) },
  mailTemplate: { findUnique: vi.fn(async () => null) },
});

const send = async (error: Error, withRecorder = true) => {
  const recorder = {
    recordMailSignals: vi.fn(async () => undefined),
  };
  const prisma = prismaFor();
  const mailContext = contextFor(error, withRecorder ? recorder : undefined);

  await expect(
    new MailController(prisma as any, mailContext as any, {
      mailTemplateId: 'template-1',
      recipient,
      optionalData: {},
      mailType: mailLogType.SubscriptionFlow,
      mailLogId: 'log-1',
    }).sendMail()
  ).rejects.toBe(error);

  return { recorder, prisma };
};

describe('MailController email quality evidence', () => {
  it('records a refusal of the address as what it means', async () => {
    const { recorder } = await send(
      new MailProviderRecipientError('Mandrill rejected', 'hard-bounce')
    );

    expect(recorder.recordMailSignals).toHaveBeenCalledWith({
      mailLogId: 'log-1',
      userId: 'user-1',
      signals: [
        {
          type: EmailQualityEventType.hardBounce,
          email: 'jane@example.com',
          detail: 'hard-bounce',
        },
      ],
      source: 'send',
    });
  });

  it('records nothing for a temporary refusal', async () => {
    const { recorder } = await send(
      new MailProviderRecipientError('Mandrill rejected', 'soft-bounce')
    );

    expect(recorder.recordMailSignals).not.toHaveBeenCalled();
  });

  it('stores the address the mail went to on the log', async () => {
    const { prisma } = await send(new MailProviderError('invalid-sender'));

    expect(prisma.mailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipientEmail: 'jane@example.com' }),
      })
    );
  });

  it('records nothing when the provider itself failed', async () => {
    const { recorder } = await send(new MailProviderError('invalid-sender'));

    expect(recorder.recordMailSignals).not.toHaveBeenCalled();
  });

  it('still fails the send with its own error when recording breaks', async () => {
    const error = new MailProviderRecipientError('rejected', 'spam');
    const recorder = {
      recordMailSignals: vi.fn(async () => {
        throw new Error('database down');
      }),
    };
    const mailContext = contextFor(error, recorder);

    await expect(
      new MailController(prismaFor() as any, mailContext as any, {
        mailTemplateId: 'template-1',
        recipient,
        optionalData: {},
        mailType: mailLogType.SubscriptionFlow,
      }).sendMail()
    ).rejects.toBe(error);
  });

  it('works without a recorder', async () => {
    const { prisma } = await send(
      new MailProviderRecipientError('rejected', 'spam'),
      false
    );

    expect(prisma.mailLog.create).toHaveBeenCalled();
  });
});
