import { EmailQualityEventType, MailLogState } from '@prisma/client';
import {
  MailWebhookController,
  shouldUpdateMailLogState,
} from './mail.webhook';

describe('shouldUpdateMailLogState', () => {
  it('moves a mail forward', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.submitted, MailLogState.delivered)
    ).toBe(true);
    expect(
      shouldUpdateMailLogState(MailLogState.deferred, MailLogState.delivered)
    ).toBe(true);
    expect(
      shouldUpdateMailLogState(MailLogState.delivered, MailLogState.bounced)
    ).toBe(true);
  });

  it('keeps a bounce when a late send event arrives', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.bounced, MailLogState.delivered)
    ).toBe(false);
    expect(
      shouldUpdateMailLogState(MailLogState.rejected, MailLogState.deferred)
    ).toBe(false);
  });

  it('does not fall back from delivered to deferred', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.delivered, MailLogState.deferred)
    ).toBe(false);
  });

  it('accepts a retried event for the same state', () => {
    expect(
      shouldUpdateMailLogState(MailLogState.bounced, MailLogState.bounced)
    ).toBe(true);
  });
});

describe('MailWebhookController', () => {
  const makeController = (
    statuses: unknown[],
    mailLog: unknown = {
      id: 'log-1',
      recipientID: 'user-1',
      state: MailLogState.delivered,
    }
  ) => {
    const prisma = {
      mailLog: {
        findUnique: jest.fn(async () => mailLog),
        update: jest.fn(async () => ({})),
      },
    };
    const recorder = {
      recordMailSignals: jest.fn(async () => undefined),
      recordUserSignal: jest.fn(),
    };
    const provider = {
      id: 'mailchimp',
      webhookForSendMail: jest.fn(async () => statuses),
    };
    const controller = new MailWebhookController(
      prisma as any,
      { mailProvider: provider } as any,
      recorder
    );
    const res = { status: jest.fn(() => ({ send: jest.fn() })) };

    return {
      prisma,
      recorder,
      receive: () =>
        controller.receiveWebhook(
          'mailchimp',
          { get: () => 'mandrill' } as any,
          res as any
        ),
    };
  };
  const signal = {
    type: EmailQualityEventType.spamComplaint,
    email: 'jane@example.com',
  };

  it('records what the event says about the address', async () => {
    const { prisma, recorder, receive } = makeController([
      { mailLogID: 'log-1', state: null, qualitySignals: [signal] },
    ]);

    await receive();

    expect(prisma.mailLog.update).not.toHaveBeenCalled();
    expect(recorder.recordMailSignals).toHaveBeenCalledWith({
      mailLogId: 'log-1',
      userId: 'user-1',
      signals: [signal],
      source: 'webhook',
    });
  });

  it('still records a bounce that arrives after a later state', async () => {
    const { prisma, recorder, receive } = makeController(
      [
        {
          mailLogID: 'log-1',
          state: MailLogState.delivered,
          qualitySignals: [signal],
        },
      ],
      { id: 'log-1', recipientID: 'user-1', state: MailLogState.bounced }
    );

    await receive();

    expect(prisma.mailLog.update).not.toHaveBeenCalled();
    expect(recorder.recordMailSignals).toHaveBeenCalled();
  });

  it('skips events for mails it does not know', async () => {
    const { recorder, receive } = makeController(
      [{ mailLogID: 'gone', state: null, qualitySignals: [signal] }],
      null
    );

    await receive();

    expect(recorder.recordMailSignals).not.toHaveBeenCalled();
  });

  it('keeps answering the provider when recording fails', async () => {
    const { recorder, receive } = makeController([
      { mailLogID: 'log-1', state: null, qualitySignals: [signal] },
    ]);
    recorder.recordMailSignals.mockRejectedValueOnce(new Error('db down'));

    await expect(receive()).resolves.toBeUndefined();
  });
});
