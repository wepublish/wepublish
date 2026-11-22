import { MailChannel, MailLogState, PrismaClient } from '@prisma/client';
import type { Mock } from 'vitest';
import { LetterContext } from './letter-context';
import {
  LetterLogSyncService,
  shouldUpdateLetterLogState,
} from './letter-log-sync.service';
import { LetterState } from './letter-provider/letter-provider.interface';

interface LogRow {
  id: string;
  state: MailLogState;
  providerLetterID: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const makeService = ({
  pending = [],
  dispatched = [],
  getMessageStates = vi.fn(async () => []),
  provider = 'configured',
}: {
  pending?: LogRow[];
  dispatched?: LogRow[];
  getMessageStates?: Mock;
  provider?: 'configured' | 'unconfigured' | 'absent';
}) => {
  // The letters still in production are asked for first, the dispatched ones
  // with whatever is left of the limit.
  const findMany = vi.fn(async (args: any) =>
    (args.where.state === MailLogState.dispatched ? dispatched : pending).slice(
      0,
      args.take
    )
  );
  const update = vi.fn(async (args: any) => args);
  const letterContext = {
    letterProvider:
      provider === 'absent' ? undefined : (
        {
          id: 'pingen',
          isConfigured: async () => provider === 'configured',
          getMessageStates,
          getName: async () => 'Pingen',
        }
      ),
  };

  return {
    service: new LetterLogSyncService(
      { mailLog: { findMany, update } } as unknown as PrismaClient,
      letterContext as unknown as LetterContext
    ),
    findMany,
    update,
    getMessageStates,
  };
};

describe('shouldUpdateLetterLogState', () => {
  it('moves a letter forward', () => {
    expect(
      shouldUpdateLetterLogState(MailLogState.accepted, MailLogState.dispatched)
    ).toBe(true);
    expect(
      shouldUpdateLetterLogState(
        MailLogState.dispatched,
        MailLogState.undeliverable
      )
    ).toBe(true);
    expect(
      shouldUpdateLetterLogState(
        MailLogState.dispatched,
        MailLogState.delivered
      )
    ).toBe(true);
  });

  it('does not take a dispatched letter back into production', () => {
    expect(
      shouldUpdateLetterLogState(MailLogState.dispatched, MailLogState.accepted)
    ).toBe(false);
    expect(
      shouldUpdateLetterLogState(MailLogState.dispatched, MailLogState.rejected)
    ).toBe(false);
  });

  it('keeps a returned letter when a late dispatch arrives', () => {
    expect(
      shouldUpdateLetterLogState(
        MailLogState.undeliverable,
        MailLogState.dispatched
      )
    ).toBe(false);
    expect(
      shouldUpdateLetterLogState(MailLogState.canceled, MailLogState.accepted)
    ).toBe(false);
  });

  // Pingen reports a problem with a letter as an issue; once it is resolved
  // there the letter is printed after all.
  it('lets a letter with a resolved issue be dispatched', () => {
    expect(
      shouldUpdateLetterLogState(MailLogState.rejected, MailLogState.dispatched)
    ).toBe(true);
  });
});

describe('LetterLogSyncService', () => {
  it('asks nothing without a letter provider', async () => {
    const { service, findMany } = makeService({ provider: 'absent' });

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 0,
      updated: 0,
      skipped: true,
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('asks nothing while the letter provider is not configured', async () => {
    const { service, findMany, getMessageStates } = makeService({
      provider: 'unconfigured',
      pending: [
        { id: 'log1', state: MailLogState.accepted, providerLetterID: 'l1' },
      ],
    });

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 0,
      updated: 0,
      skipped: true,
    });
    expect(findMany).not.toHaveBeenCalled();
    expect(getMessageStates).not.toHaveBeenCalled();
  });

  it('only looks at letters of the current provider that are still in production', async () => {
    const { service, findMany } = makeService({});

    await service.syncOpenStates();

    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: {
        channel: MailChannel.letter,
        providerLetterID: { not: null },
        mailProviderID: 'pingen',
        state: { in: [MailLogState.submitted, MailLogState.accepted] },
      },
      orderBy: { sentDate: 'desc' },
    });
  });

  it('rechecks dispatched letters for thirty days, the longest waiting first', async () => {
    const before = Date.now();
    const { service, findMany } = makeService({});

    await service.syncOpenStates();

    const query = findMany.mock.calls[1][0];
    expect(query).toMatchObject({
      where: {
        channel: MailChannel.letter,
        providerLetterID: { not: null },
        mailProviderID: 'pingen',
        state: MailLogState.dispatched,
      },
      orderBy: { sentDate: 'asc' },
    });

    const since = (query.where.sentDate.gte as Date).getTime();
    expect(since).toBeGreaterThanOrEqual(before - 30 * DAY_MS);
    expect(since).toBeLessThanOrEqual(Date.now() - 30 * DAY_MS);
  });

  it('spends the limit on letters in production before dispatched ones', async () => {
    const { service, findMany, getMessageStates } = makeService({
      pending: [
        { id: 'log1', state: MailLogState.accepted, providerLetterID: 'l1' },
        { id: 'log2', state: MailLogState.submitted, providerLetterID: 'l2' },
      ],
      dispatched: [
        { id: 'log3', state: MailLogState.dispatched, providerLetterID: 'l3' },
        { id: 'log4', state: MailLogState.dispatched, providerLetterID: 'l4' },
      ],
    });

    const result = await service.syncOpenStates(3);

    expect(findMany.mock.calls[0][0].take).toBe(3);
    expect(findMany.mock.calls[1][0].take).toBe(1);
    expect(getMessageStates).toHaveBeenCalledWith(['l1', 'l2', 'l3']);
    expect(result.checked).toBe(3);
  });

  it('leaves dispatched letters alone once the limit is used up', async () => {
    const { service, findMany } = makeService({
      pending: [
        { id: 'log1', state: MailLogState.accepted, providerLetterID: 'l1' },
      ],
    });

    await service.syncOpenStates(1);

    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('never asks about more than the cap', async () => {
    const { service, findMany } = makeService({});

    await service.syncOpenStates(100000);

    expect(findMany.mock.calls[0][0].take).toBe(2000);
  });

  it('writes the state and payload the provider reports', async () => {
    const { service, update } = makeService({
      pending: [
        { id: 'log1', state: MailLogState.accepted, providerLetterID: 'l1' },
      ],
      dispatched: [
        { id: 'log2', state: MailLogState.dispatched, providerLetterID: 'l2' },
      ],
      getMessageStates: vi.fn(async () => [
        {
          providerLetterID: 'l1',
          state: LetterState.dispatched,
          letterData: '{"status":"sent"}',
        },
        {
          providerLetterID: 'l2',
          state: LetterState.undeliverable,
          letterData: '{"status":"undeliverable"}',
        },
      ]),
    });

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 2,
      updated: 2,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { state: MailLogState.dispatched, mailData: '{"status":"sent"}' },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'log2' },
      data: {
        state: MailLogState.undeliverable,
        mailData: '{"status":"undeliverable"}',
      },
    });
  });

  it('leaves a letter alone that is unchanged, unknown to the provider or reported older', async () => {
    const { service, update } = makeService({
      pending: [
        { id: 'log1', state: MailLogState.accepted, providerLetterID: 'l1' },
        { id: 'log2', state: MailLogState.accepted, providerLetterID: 'l2' },
      ],
      dispatched: [
        { id: 'log3', state: MailLogState.dispatched, providerLetterID: 'l3' },
      ],
      getMessageStates: vi.fn(async () => [
        { providerLetterID: 'l1', state: LetterState.accepted },
        { providerLetterID: 'l3', state: LetterState.accepted },
      ]),
    });

    await expect(service.syncOpenStates()).resolves.toEqual({
      checked: 3,
      updated: 0,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('fails when the provider cannot be asked', async () => {
    const { service } = makeService({
      pending: [
        { id: 'log1', state: MailLogState.accepted, providerLetterID: 'l1' },
      ],
      getMessageStates: vi.fn(async () => {
        throw new Error('Unauthorized');
      }),
    });

    await expect(service.syncOpenStates()).rejects.toThrow('Unauthorized');
  });
});
