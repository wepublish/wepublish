import { PrismaClient } from '@prisma/client';
import { OneChannelStateService } from './one-channel-state.service';

describe('OneChannelStateService', () => {
  const successAt = new Date('2026-09-16T12:00:00.000Z');
  const failureAt = new Date('2026-09-16T12:05:00.000Z');
  let prisma: { oneChannelState: { upsert: jest.Mock; findUnique: jest.Mock } };
  let service: OneChannelStateService;

  beforeEach(() => {
    prisma = {
      oneChannelState: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ lastSuccessAt: successAt }),
      },
    };
    service = new OneChannelStateService(prisma as unknown as PrismaClient);
  });

  it('persists a success against the singleton row', async () => {
    await service.recordSuccess(successAt);

    expect(prisma.oneChannelState.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: { id: 'singleton', lastSuccessAt: successAt },
      update: { lastSuccessAt: successAt },
    });
  });

  it('keeps the last attempt and error in memory without writing', async () => {
    service.recordFailure(failureAt, '403 Forbidden');

    expect(prisma.oneChannelState.upsert).not.toHaveBeenCalled();
    await expect(service.getState()).resolves.toEqual({
      lastSuccessAt: successAt,
      lastAttemptAt: failureAt,
      lastError: '403 Forbidden',
    });
  });

  it('clears the recorded error once a later attempt succeeds', async () => {
    service.recordFailure(failureAt, '403 Forbidden');
    await service.recordSuccess(successAt);

    await expect(service.getState()).resolves.toEqual({
      lastSuccessAt: successAt,
      lastAttemptAt: successAt,
      lastError: null,
    });
  });

  it('reports a null last success when the row does not exist yet', async () => {
    prisma.oneChannelState.findUnique.mockResolvedValue(null);

    await expect(service.getState()).resolves.toEqual({
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastError: null,
    });
  });
});
