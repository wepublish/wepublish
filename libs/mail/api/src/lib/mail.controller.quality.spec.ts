import { EmailQualityEventType } from '@prisma/client';
import { MailController, mailLogType } from './mail.controller';
import {
  MailProviderError,
  MailProviderRecipientError,
} from './mail-provider/mail-provider.interface';

const recipient = { id: 'user-1', email: 'jane@example.com' } as any;

const send = async (error: Error, withRecorder = true) => {
  const recorder = {
    recordMailSignals: jest.fn(async () => undefined),
    recordUserSignal: jest.fn(),
  };
  const prisma = { mailLog: { create: jest.fn(async () => ({})) } };
  const mailContext = {
    sendComposedMail: jest.fn(async () => {
      throw error;
    }),
    jwtGenerator: jest.fn(async () => 'jwt'),
    mailProvider: { id: 'mailchimp' },
    emailQualityRecorder: withRecorder ? recorder : undefined,
  };

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
  it('records a refusal of the address with its reason', async () => {
    const { recorder } = await send(
      new MailProviderRecipientError('Mandrill rejected', 'hard-bounce')
    );

    expect(recorder.recordMailSignals).toHaveBeenCalledWith({
      mailLogId: 'log-1',
      userId: 'user-1',
      signals: [
        {
          type: EmailQualityEventType.rejected,
          email: 'jane@example.com',
          detail: 'hard-bounce',
        },
      ],
      source: 'send',
    });
  });

  it('records nothing when the provider itself failed', async () => {
    const { recorder } = await send(new MailProviderError('invalid-sender'));

    expect(recorder.recordMailSignals).not.toHaveBeenCalled();
  });

  it('still fails the send with its own error when recording breaks', async () => {
    const error = new MailProviderRecipientError('rejected', 'spam');
    const recorder = {
      recordMailSignals: jest.fn(async () => {
        throw new Error('database down');
      }),
      recordUserSignal: jest.fn(),
    };
    const mailContext = {
      sendComposedMail: jest.fn(async () => {
        throw error;
      }),
      jwtGenerator: jest.fn(async () => 'jwt'),
      mailProvider: { id: 'mailchimp' },
      emailQualityRecorder: recorder,
    };

    await expect(
      new MailController(
        { mailLog: { create: jest.fn() } } as any,
        mailContext as any,
        {
          mailTemplateId: 'template-1',
          recipient,
          optionalData: {},
          mailType: mailLogType.SubscriptionFlow,
        }
      ).sendMail()
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
