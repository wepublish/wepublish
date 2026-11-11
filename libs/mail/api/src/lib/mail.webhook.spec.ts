import { UnauthorizedException } from '@nestjs/common';
import { EmailQualityEventType, MailLogState } from '@prisma/client';
import {
  MailWebhookController,
  shouldUpdateMailLogState,
} from './mail.webhook';
import { MailWebhookSignatureError } from './mail-provider/mail-provider.interface';

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
        findUnique: vi.fn(async () => mailLog),
        update: vi.fn(async () => ({})),
      },
      settingMailProvider: {
        update: vi.fn(async () => ({})),
      },
    };
    const recorder = {
      recordMailSignals: vi.fn(async () => undefined),
      recordAddressSignals: vi.fn(async () => undefined),
      recompute: vi.fn(),
    };
    const provider = {
      id: 'mailchimp',
      webhookForSendMail: vi.fn(async () => statuses),
    };
    const controller = new MailWebhookController(
      prisma as any,
      { mailProvider: provider } as any,
      recorder
    );
    const send = vi.fn();
    const res = { status: vi.fn(() => ({ send })) };

    return {
      prisma,
      recorder,
      provider,
      res,
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
    const { recorder, receive, res } = makeController([
      { mailLogID: 'log-1', state: null, qualitySignals: [signal] },
    ]);
    recorder.recordMailSignals.mockRejectedValueOnce(new Error('db down'));

    await expect(receive()).resolves.toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('records an event that is only about an address, like a campaign bounce', async () => {
    const { prisma, recorder, receive } = makeController([
      { email: 'jane@example.com', state: null, qualitySignals: [signal] },
    ]);

    await receive();

    expect(prisma.mailLog.findUnique).not.toHaveBeenCalled();
    expect(recorder.recordMailSignals).not.toHaveBeenCalled();
    expect(recorder.recordAddressSignals).toHaveBeenCalledWith({
      email: 'jane@example.com',
      signals: [signal],
      source: 'webhook',
    });
  });

  it('refuses a call that does not come from the provider', async () => {
    const { prisma, provider, receive, res } = makeController([]);
    provider.webhookForSendMail.mockRejectedValueOnce(
      new MailWebhookSignatureError('Webhook signature failed')
    );

    await expect(receive()).rejects.toBeInstanceOf(UnauthorizedException);
    expect(res.status).not.toHaveBeenCalled();
    expect(prisma.settingMailProvider.update).not.toHaveBeenCalled();
  });

  // So an admin can see that the provider reaches this installation at all.
  it('notes when the provider last reached us', async () => {
    const { prisma, receive } = makeController([]);

    await receive();

    expect(prisma.settingMailProvider.update).toHaveBeenCalledWith({
      where: { id: 'mailchimp' },
      data: { lastWebhookAt: expect.any(Date) },
    });
  });

  it('keeps answering the provider when the note cannot be written', async () => {
    const { prisma, receive, res } = makeController([]);
    prisma.settingMailProvider.update.mockRejectedValueOnce(
      new Error('db down')
    );

    await expect(receive()).resolves.toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // Providers retry on 5xx or, like Brevo, drop the event for good. Neither
  // helps with a payload we cannot handle, so the error stays in our log.
  it('answers 200 to a payload it cannot handle', async () => {
    const { provider, receive, res } = makeController([]);
    provider.webhookForSendMail.mockRejectedValueOnce(
      new Error('Unexpected token in JSON')
    );

    await expect(receive()).resolves.toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
