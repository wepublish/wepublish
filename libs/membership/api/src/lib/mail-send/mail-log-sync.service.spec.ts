import {
  EmailQualityEventType,
  MailLogState,
  PrismaClient,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { MailLogSyncService } from './mail-log-sync.service';
import type { Mock } from 'vitest';

interface LogRow {
  id: string;
  state: MailLogState;
  mailProviderMessageID: string | null;
}

const makeService = (
  logs: LogRow[],
  getMessageStates: Mock,
  providerPresent = true
) => {
  const findMany = vi.fn(async () => logs);
  const update = vi.fn(async (args: any) => args);
  const noteProvider = vi.fn(async (args: any) => args);
  const prisma = {
    mailLog: { findMany, update },
    settingMailProvider: { update: noteProvider },
  };
  const recordMailSignals = vi.fn(async () => undefined);
  const mailContext = {
    mailProvider:
      providerPresent ?
        { id: 'mailchimp', getMessageStates, getName: async () => 'Mailchimp' }
      : undefined,
    emailQualityRecorder: {
      recordMailSignals,
      recordAddressSignals: vi.fn(),
      recompute: vi.fn(),
    },
  };

  return {
    service: new MailLogSyncService(
      prisma as unknown as PrismaClient,
      mailContext as unknown as MailContext
    ),
    findMany,
    update,
    noteProvider,
    recordMailSignals,
  };
};

describe('MailLogSyncService', () => {
  // So an admin can see when the provider was last asked, and what it said.
  describe('noting the poll on the provider settings', () => {
    it('notes a poll that had nothing to ask', async () => {
      const { service, noteProvider } = makeService(
        [],
        vi.fn(async () => [])
      );

      await service.syncOpenStates();

      expect(noteProvider).toHaveBeenCalledWith({
        where: { id: 'mailchimp' },
        data: { lastPollAt: expect.any(Date), lastPollError: null },
      });
    });

    it('clears an earlier error once a poll succeeds', async () => {
      const { service, noteProvider } = makeService(
        [
          {
            id: 'log1',
            state: MailLogState.submitted,
            mailProviderMessageID: 'm1',
          },
        ],
        vi.fn(async () => [])
      );

      await service.syncOpenStates();

      expect(noteProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lastPollError: null }),
        })
      );
    });

    it('keeps what the provider answered when the poll fails, and still fails', async () => {
      const { service, noteProvider } = makeService(
        [
          {
            id: 'log1',
            state: MailLogState.submitted,
            mailProviderMessageID: 'm1',
          },
        ],
        vi.fn(async () => {
          throw new Error('rate limited');
        })
      );

      await expect(service.syncOpenStates()).rejects.toThrow('rate limited');
      expect(noteProvider).toHaveBeenCalledWith({
        where: { id: 'mailchimp' },
        data: { lastPollAt: expect.any(Date), lastPollError: 'rate limited' },
      });
    });

    it('notes nothing without a provider', async () => {
      const { service, noteProvider } = makeService([], vi.fn(), false);

      await service.syncOpenStates();

      expect(noteProvider).not.toHaveBeenCalled();
    });
  });

  it('writes the state the provider reports back to the log', async () => {
    const getMessageStates = vi.fn(async () => [
      {
        providerMessageID: 'm1',
        state: MailLogState.delivered,
        mailData: '{"state":"sent"}',
      },
    ]);
    const { service, update } = makeService(
      [
        {
          id: 'log1',
          state: MailLogState.submitted,
          mailProviderMessageID: 'm1',
        },
      ],
      getMessageStates
    );

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 1,
      updated: 1,
    });
    expect(getMessageStates).toHaveBeenCalledWith(['m1']);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { state: MailLogState.delivered, mailData: '{"state":"sent"}' },
    });
  });

  it('only asks about mails that can still change and have a provider id', async () => {
    const { service, findMany } = makeService(
      [],
      vi.fn(async () => [])
    );

    await service.syncOpenStates();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          state: {
            in: [
              MailLogState.submitted,
              MailLogState.accepted,
              MailLogState.deferred,
            ],
          },
          mailProviderMessageID: { not: null },
          mailProviderID: 'mailchimp',
        },
      })
    );
  });

  it('does not write when the provider reports the state it already has', async () => {
    const { service, update } = makeService(
      [
        {
          id: 'log1',
          state: MailLogState.submitted,
          mailProviderMessageID: 'm1',
        },
      ],
      vi.fn(async () => [
        { providerMessageID: 'm1', state: MailLogState.submitted },
      ])
    );

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 1,
      updated: 0,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('leaves a log alone when the provider no longer knows the message', async () => {
    const { service, update } = makeService(
      [
        {
          id: 'log1',
          state: MailLogState.submitted,
          mailProviderMessageID: 'm1',
        },
      ],
      vi.fn(async () => [])
    );

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 1,
      updated: 0,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('skips the provider round trip when nothing is open', async () => {
    const getMessageStates = vi.fn(async () => []);
    const { service } = makeService([], getMessageStates);

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 0,
      updated: 0,
    });
    expect(getMessageStates).not.toHaveBeenCalled();
  });

  it('is a no-op without a configured provider', async () => {
    const { service, findMany } = makeService(
      [],
      vi.fn(async () => []),
      false
    );

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 0,
      updated: 0,
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('caps how many mails one call looks at', async () => {
    const { service, findMany } = makeService(
      [],
      vi.fn(async () => [])
    );

    await service.syncOpenStates(10_000);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 })
    );
  });

  it('only asks about mails the current provider sent', async () => {
    const { service, findMany } = makeService(
      [],
      vi.fn(async () => [])
    );

    await service.syncOpenStates();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ mailProviderID: 'mailchimp' }),
      })
    );
  });

  it('reports what the polled state says about the address', async () => {
    const signal = {
      type: EmailQualityEventType.hardBounce,
      email: 'jane@example.com',
    };
    const { service, recordMailSignals } = makeService(
      [
        {
          id: 'log1',
          state: MailLogState.submitted,
          mailProviderMessageID: 'm1',
          recipientID: 'user-1',
        } as any,
      ],
      vi.fn(async () => [
        {
          providerMessageID: 'm1',
          state: MailLogState.bounced,
          qualitySignals: [signal],
        },
      ])
    );

    await service.syncOpenStates();

    expect(recordMailSignals).toHaveBeenCalledWith({
      mailLogId: 'log1',
      userId: 'user-1',
      signals: [signal],
      source: 'poll',
    });
  });

  it('does not move a mail back to an earlier state', async () => {
    const { service, update } = makeService(
      [
        {
          id: 'log1',
          state: MailLogState.deferred,
          mailProviderMessageID: 'm1',
        },
      ],
      vi.fn(async () => [
        { providerMessageID: 'm1', state: MailLogState.submitted },
      ])
    );

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 1,
      updated: 0,
    });
    expect(update).not.toHaveBeenCalled();
  });
});
