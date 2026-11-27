import { NotFoundException } from '@nestjs/common';
import { MailLogState, PrismaClient } from '@prisma/client';
import { LetterState } from './letter-provider/letter-provider.interface';
import { LetterWebhookController } from './letter.webhook';
import { LettersModuleOptions } from './letters-module-options';

const makeController = (
  statuses: unknown[],
  letterLog: unknown = {
    id: 'log-1',
    state: MailLogState.accepted,
    error: null,
  }
) => {
  const prisma = {
    mailLog: {
      findUnique: vi.fn(async () => letterLog),
      update: vi.fn(async () => ({})),
    },
  };
  const letterProvider = {
    id: 'pingen',
    webhookForSendLetter: vi.fn(async () => statuses),
  };
  const res = { status: vi.fn().mockReturnThis(), send: vi.fn() };
  const req = { get: () => 'pingen.com' };

  return {
    controller: new LetterWebhookController(
      prisma as unknown as PrismaClient,
      { letterProvider } as unknown as LettersModuleOptions
    ),
    prisma,
    req: req as any,
    res: res as any,
  };
};

describe('LetterWebhookController', () => {
  it('writes the state a letter moved on to', async () => {
    const { controller, prisma, req, res } = makeController([
      {
        providerLetterID: 'letter-1',
        state: LetterState.dispatched,
        letterData: '{"type":"webhook_sent"}',
      },
    ]);

    await controller.receiveWebhook('pingen', req, res);

    expect(prisma.mailLog.findUnique).toHaveBeenCalledWith({
      where: { providerLetterID: 'letter-1' },
    });
    expect(prisma.mailLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: {
        state: MailLogState.dispatched,
        mailData: '{"type":"webhook_sent"}',
        error: null,
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('keeps the reason a letter came back with', async () => {
    const { controller, prisma, req, res } = makeController(
      [
        {
          providerLetterID: 'letter-1',
          state: LetterState.undeliverable,
          error: 'Moved',
        },
      ],
      { id: 'log-1', state: MailLogState.dispatched, error: null }
    );

    await controller.receiveWebhook('pingen', req, res);

    expect(prisma.mailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: MailLogState.undeliverable,
          error: 'Moved',
        }),
      })
    );
  });

  // Events get retried and arrive out of order, and the nightly poll may
  // already have written what happened later.
  it('ignores an event older than what the log already says, and still answers', async () => {
    const { controller, prisma, req, res } = makeController(
      [{ providerLetterID: 'letter-1', state: LetterState.dispatched }],
      { id: 'log-1', state: MailLogState.undeliverable, error: 'Moved' }
    );

    await controller.receiveWebhook('pingen', req, res);

    expect(prisma.mailLog.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('answers an event for a letter it does not know', async () => {
    const { controller, prisma, req, res } = makeController(
      [{ providerLetterID: 'letter-9', state: LetterState.dispatched }],
      null
    );

    await controller.receiveWebhook('pingen', req, res);

    expect(prisma.mailLog.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('knows no provider under another id', async () => {
    const { controller, req, res } = makeController([]);

    await expect(
      controller.receiveWebhook('other', req, res)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
