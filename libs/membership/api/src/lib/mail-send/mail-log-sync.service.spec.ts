import { MailLogState, PrismaClient } from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { MailLogSyncService } from './mail-log-sync.service';

interface LogRow {
  id: string;
  state: MailLogState;
  mailProviderMessageID: string | null;
}

const makeService = (
  logs: LogRow[],
  getMessageStates: jest.Mock,
  providerPresent = true
) => {
  const findMany = jest.fn(async () => logs);
  const update = jest.fn(async (args: any) => args);
  const prisma = { mailLog: { findMany, update } };
  const mailContext = {
    mailProvider:
      providerPresent ?
        { getMessageStates, getName: async () => 'Mailchimp' }
      : undefined,
  };

  return {
    service: new MailLogSyncService(
      prisma as unknown as PrismaClient,
      mailContext as unknown as MailContext
    ),
    findMany,
    update,
  };
};

describe('MailLogSyncService', () => {
  it('writes the state the provider reports back to the log', async () => {
    const getMessageStates = jest.fn(async () => [
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
      jest.fn(async () => [])
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
      jest.fn(async () => [
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
      jest.fn(async () => [])
    );

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 1,
      updated: 0,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('skips the provider round trip when nothing is open', async () => {
    const getMessageStates = jest.fn(async () => []);
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
      jest.fn(async () => []),
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
      jest.fn(async () => [])
    );

    await service.syncOpenStates(10_000);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 })
    );
  });
});
