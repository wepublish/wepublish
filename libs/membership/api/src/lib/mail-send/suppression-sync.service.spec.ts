import {
  EmailQualityEventSource,
  EmailQualityEventType,
  PrismaClient,
} from '@prisma/client';
import { MailContext, MailQualitySignal } from '@wepublish/mail/api';
import { SuppressionSyncService } from './suppression-sync.service';

const signal = (
  email: string,
  overrides: Partial<MailQualitySignal> = {}
): MailQualitySignal => ({
  type: EmailQualityEventType.hardBounce,
  email,
  detail: null,
  occurredAt: new Date('2026-10-20T10:00:00Z'),
  providerEventId: `mailchimp-reject:${email}:2026-10-20 10:00:00`,
  ...overrides,
});

const makeService = ({
  signals = [] as MailQualitySignal[],
  known = [] as string[],
  providerPresent = true,
  listFails = null as Error | null,
} = {}) => {
  const listSuppressions = vi.fn(async () => {
    if (listFails) {
      throw listFails;
    }

    return signals;
  });
  const recordAddressSignals = vi.fn(async () => undefined);
  const noteProvider = vi.fn(async (args: unknown) => args);
  const prisma = {
    emailQualityEvent: {
      findMany: vi.fn(async () =>
        known.map(providerEventId => ({ providerEventId }))
      ),
    },
    settingMailProvider: { update: noteProvider },
  };
  const mailContext = {
    mailProvider:
      providerPresent ?
        { id: 'mailchimp', listSuppressions, getName: async () => 'Mandrill' }
      : undefined,
    emailQualityRecorder: {
      recordMailSignals: vi.fn(),
      recordAddressSignals,
      recompute: vi.fn(),
    },
  };

  return {
    service: new SuppressionSyncService(
      prisma as unknown as PrismaClient,
      mailContext as unknown as MailContext
    ),
    listSuppressions,
    recordAddressSignals,
    noteProvider,
    prisma,
  };
};

describe('SuppressionSyncService', () => {
  it('records what the provider refuses, one call per address, as polled evidence', async () => {
    const { service, recordAddressSignals } = makeService({
      signals: [
        signal('dead@example.com'),
        signal('dead@example.com', {
          type: EmailQualityEventType.spamComplaint,
          providerEventId:
            'mailchimp-reject:dead@example.com:2026-10-21 10:00:00',
        }),
        signal('gone@example.com'),
      ],
    });

    await expect(service.syncSuppressions()).resolves.toEqual({
      listed: 3,
      recorded: 2,
    });
    expect(recordAddressSignals).toHaveBeenCalledTimes(2);
    expect(recordAddressSignals).toHaveBeenCalledWith({
      email: 'dead@example.com',
      signals: [
        expect.objectContaining({ type: EmailQualityEventType.hardBounce }),
        expect.objectContaining({ type: EmailQualityEventType.spamComplaint }),
      ],
      source: EmailQualityEventSource.poll,
    });
  });

  it('skips entries recorded on an earlier night, so nobody is re-evaluated for nothing', async () => {
    const { service, recordAddressSignals, prisma } = makeService({
      signals: [signal('dead@example.com'), signal('gone@example.com')],
      known: ['mailchimp-reject:dead@example.com:2026-10-20 10:00:00'],
    });

    await expect(service.syncSuppressions()).resolves.toEqual({
      listed: 2,
      recorded: 1,
    });
    expect(recordAddressSignals).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'gone@example.com' })
    );
    expect(prisma.emailQualityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { providerEventId: { in: expect.arrayContaining([]) } },
      })
    );
  });

  it('carries on when one address cannot be recorded', async () => {
    const { service, recordAddressSignals } = makeService({
      signals: [signal('a@example.com'), signal('b@example.com')],
    });
    recordAddressSignals.mockRejectedValueOnce(new Error('db down'));

    await expect(service.syncSuppressions()).resolves.toEqual({
      listed: 2,
      recorded: 1,
    });
  });

  it('notes the poll on the provider settings, and what went wrong', async () => {
    const { service, noteProvider } = makeService();

    await service.syncSuppressions();

    expect(noteProvider).toHaveBeenCalledWith({
      where: { id: 'mailchimp' },
      data: { lastPollAt: expect.any(Date), lastPollError: null },
    });

    const failing = makeService({ listFails: new Error('Invalid_Key') });

    await expect(failing.service.syncSuppressions()).rejects.toThrow(
      'Invalid_Key'
    );
    expect(failing.noteProvider).toHaveBeenCalledWith({
      where: { id: 'mailchimp' },
      data: { lastPollAt: expect.any(Date), lastPollError: 'Invalid_Key' },
    });
  });

  it('does nothing without a provider', async () => {
    const { service, noteProvider } = makeService({ providerPresent: false });

    await expect(service.syncSuppressions()).resolves.toEqual({
      listed: 0,
      recorded: 0,
    });
    expect(noteProvider).not.toHaveBeenCalled();
  });
});
