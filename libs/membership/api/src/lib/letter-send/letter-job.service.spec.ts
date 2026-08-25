import { LetterLogType, Prisma, PrismaClient } from '@prisma/client';
import { LetterContext, UserWithAddress } from '@wepublish/letter/api';
import { LetterJobService, letterIdentifierFor } from './letter-job.service';

const runDate = new Date('2026-08-25T00:00:00.000Z');

function user(withAddress: boolean): UserWithAddress {
  return {
    id: 'user-1',
    firstName: 'Jane',
    name: 'Doe',
    address:
      withAddress ?
        {
          company: null,
          streetAddress: 'Musterstrasse',
          streetAddressNumber: '7',
          streetAddress2: null,
          streetAddress2Number: null,
          zipCode: '8000',
          city: 'Zürich',
          country: 'CH',
        }
      : null,
  } as unknown as UserWithAddress;
}

function createService() {
  const prisma = {
    letterJob: { create: jest.fn() },
  } as unknown as PrismaClient;

  return {
    service: new LetterJobService(prisma, {} as LetterContext),
    prisma,
  };
}

const props = {
  letterTemplateId: 'template-1',
  type: LetterLogType.subscriptionFlow,
  subscriptionId: 'subscription-1',
  invoiceId: 'invoice-1',
  daysAwayFromEnding: 14,
  runDate,
};

describe('LetterJobService.enqueue', () => {
  it('queues a letter for a recipient with an address', async () => {
    const { service, prisma } = createService();
    (prisma.letterJob.create as jest.Mock).mockResolvedValue({ id: 'job-1' });

    const job = await service.enqueue({ ...props, user: user(true) });

    expect(job).toEqual({ id: 'job-1' });
    expect(prisma.letterJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        letterIdentifier: letterIdentifierFor({ ...props, user: user(true) }),
        daysAwayFromEnding: 14,
        runDate,
      }),
    });
  });

  it('skips a recipient without a usable address instead of failing', async () => {
    const { service, prisma } = createService();

    const job = await service.enqueue({ ...props, user: user(false) });

    expect(job).toBeNull();
    expect(prisma.letterJob.create).not.toHaveBeenCalled();
  });

  it('does not queue the same letter twice', async () => {
    const { service, prisma } = createService();
    (prisma.letterJob.create as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7',
      })
    );

    await expect(
      service.enqueue({ ...props, user: user(true) })
    ).resolves.toBeNull();
  });

  it('lets other database errors through', async () => {
    const { service, prisma } = createService();
    (prisma.letterJob.create as jest.Mock).mockRejectedValue(
      new Error('connection lost')
    );

    await expect(
      service.enqueue({ ...props, user: user(true) })
    ).rejects.toThrow('connection lost');
  });
});

describe('letterIdentifierFor', () => {
  it('is stable for the same flow step and recipient', () => {
    expect(letterIdentifierFor({ ...props, user: user(true) })).toBe(
      letterIdentifierFor({ ...props, user: user(true) })
    );
  });

  it('differs per run date, so a later run sends again', () => {
    expect(letterIdentifierFor({ ...props, user: user(true) })).not.toBe(
      letterIdentifierFor({
        ...props,
        user: user(true),
        runDate: new Date('2026-08-26T00:00:00.000Z'),
      })
    );
  });
});
