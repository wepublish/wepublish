import { BadRequestException } from '@nestjs/common';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { PrismaClient } from '@prisma/client';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailRecipientBase } from './mail-send.model';

const makeService = (
  prisma: any,
  mailContext: any = { sendMail: jest.fn() },
  recipientService: any = {}
) =>
  new MailSendJobService(
    prisma as PrismaClient,
    mailContext as unknown as MailContext,
    recipientService as MailSendRecipientService
  );

const template = (context: string | null) => ({
  id: 'tpl-1',
  name: 'Newsletter',
  context,
});

/**
 * Enough of prisma to exercise the queue: jobs and their recipient rows live in
 * two arrays, so a test can assert what a second run does to rows a first run
 * already touched.
 */
function fakePrisma(templateRow: any = template('custom')) {
  const jobs: any[] = [];
  const entries: any[] = [];
  let entrySeq = 0;

  const matches = (row: any, where: any = {}): boolean =>
    Object.entries(where).every(([key, condition]) => {
      if (key === 'OR') {
        return (condition as any[]).some(part => matches(row, part));
      }

      if (
        condition &&
        typeof condition === 'object' &&
        !(condition instanceof Date)
      ) {
        if ('in' in condition) {
          return (condition as any).in.includes(row[key]);
        }
        if ('lt' in condition) {
          return row[key] != null && row[key] < (condition as any).lt;
        }
      }

      return row[key] === condition;
    });

  const apply = (row: any, data: any) => {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'increment' in (value as any)) {
        row[key] = (row[key] ?? 0) + (value as any).increment;
      } else {
        row[key] = value;
      }
    }
    return row;
  };

  const sortBy = (rows: any[], orderBy: any) => {
    if (!orderBy) {
      return rows;
    }
    const [field, direction] = Object.entries(orderBy)[0] as [string, string];

    return [...rows].sort((a, b) =>
      direction === 'desc' ?
        b[field] > a[field] ?
          1
        : -1
      : a[field] > b[field] ? 1
      : -1
    );
  };

  return {
    jobs,
    entries,
    mailTemplate: { findUnique: jest.fn(async () => templateRow) },
    invoice: { findFirst: jest.fn(async () => null) },
    user: {
      findUnique: jest.fn(async ({ where }: any) => ({
        id: where.id,
        email: `${where.id}@x.ch`,
      })),
    },
    mailSendJob: {
      create: jest.fn(async ({ data }: any) => {
        const { recipients, ...rest } = data;
        const job = {
          id: `job-${jobs.length + 1}`,
          createdAt: new Date(),
          sentCount: 0,
          failedCount: 0,
          sendingCount: 0,
          totalCount: 0,
          resumeCount: 0,
          error: null,
          heartbeatAt: null,
          startedAt: null,
          finishedAt: null,
          recipientsResolvedAt: null,
          ...rest,
        };
        jobs.push(job);

        for (const entry of recipients?.create ?? []) {
          entries.push({
            id: `entry-${entrySeq++}`,
            jobId: job.id,
            state: 'pending',
            attempts: 0,
            error: null,
            sentAt: null,
            mailLogId: null,
            subscriptionId: null,
            ...entry,
          });
        }

        return { ...job, recipients: entries.filter(e => e.jobId === job.id) };
      }),
      findUnique: jest.fn(async ({ where }: any) =>
        jobs.find(job => job.id === where.id)
      ),
      findUniqueOrThrow: jest.fn(async ({ where }: any) => {
        const job = jobs.find(candidate => candidate.id === where.id);
        if (!job) {
          throw new Error('not found');
        }
        return job;
      }),
      findMany: jest.fn(async ({ where, orderBy }: any = {}) =>
        sortBy(
          jobs.filter(job => matches(job, where)),
          orderBy
        )
      ),
      update: jest.fn(async ({ where, data }: any) =>
        apply(
          jobs.find(job => job.id === where.id),
          data
        )
      ),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const affected = jobs.filter(job => matches(job, where));
        affected.forEach(job => apply(job, data));

        return { count: affected.length };
      }),
    },
    mailSendJobRecipient: {
      createMany: jest.fn(async ({ data }: any) => {
        for (const entry of data) {
          entries.push({
            id: `entry-${entrySeq++}`,
            state: 'pending',
            attempts: 0,
            error: null,
            sentAt: null,
            mailLogId: null,
            ...entry,
          });
        }

        return { count: data.length };
      }),
      findMany: jest.fn(
        async ({ where, orderBy, skip = 0, take }: any = {}) => {
          const found = sortBy(
            entries.filter(entry => matches(entry, where)),
            orderBy
          ).slice(skip);

          return take ? found.slice(0, take) : found;
        }
      ),
      count: jest.fn(
        async ({ where }: any = {}) =>
          entries.filter(entry => matches(entry, where)).length
      ),
      update: jest.fn(async ({ where, data }: any) =>
        apply(
          entries.find(entry => entry.id === where.id),
          data
        )
      ),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const affected = entries.filter(entry => matches(entry, where));
        affected.forEach(entry => apply(entry, data));

        return { count: affected.length };
      }),
      deleteMany: jest.fn(async ({ where }: any) => {
        const kept = entries.filter(entry => !matches(entry, where));
        const count = entries.length - kept.length;
        entries.splice(0, entries.length, ...kept);

        return { count };
      }),
      groupBy: jest.fn(async ({ where }: any) => {
        const counts = new Map<string, number>();

        for (const entry of entries.filter(row => matches(row, where))) {
          counts.set(entry.state, (counts.get(entry.state) ?? 0) + 1);
        }

        return [...counts].map(([state, total]) => ({
          state,
          _count: { _all: total },
        }));
      }),
    },
  };
}

const recipientServiceFor = (users: string[]) => {
  const recipients = users.map(id => ({ user: { id, email: `${id}@x.ch` } }));

  return {
    count: jest.fn(async () => recipients.length),
    allowsSubscriptionTemplates: () => false,
    resolvePage: jest.fn(async (_audience: any, skip: number, take: number) =>
      recipients.slice(skip, skip + take)
    ),
    loadQueued: jest.fn(
      async (refs: any[]) =>
        new Map(
          refs.map(ref => [
            `${ref.userId}:`,
            { user: { id: ref.userId, email: `${ref.userId}@x.ch` } },
          ])
        )
    ),
  };
};

const audience = { base: MailRecipientBase.allUsers };

/**
 * Put a job straight into the fake database. Tests that exercise the send loop
 * do not go through `createJob`, whose fire-and-forget drain would race them.
 */
const seedJob = (
  prisma: any,
  {
    status = 'queued',
    resolved = false,
    states = [] as string[],
    heartbeatAt = null as Date | null,
    resumeCount = 0,
  } = {}
) => {
  const job = {
    id: `job-${prisma.jobs.length + 1}`,
    createdAt: new Date(),
    mailTemplateId: 'tpl-1',
    createdByUserId: 'editor-1',
    audience: 'allUsers',
    recipientFilter: audience,
    status,
    totalCount: states.length,
    sentCount: 0,
    failedCount: 0,
    sendingCount: 0,
    resumeCount,
    error: null,
    startedAt: status === 'queued' ? null : new Date(),
    heartbeatAt,
    finishedAt: null,
    recipientsResolvedAt: resolved ? new Date() : null,
  };
  prisma.jobs.push(job);

  states.forEach((state, position) => {
    prisma.entries.push({
      id: `${job.id}-entry-${position}`,
      jobId: job.id,
      userId: `u${position + 1}`,
      subscriptionId: null,
      position,
      state,
      attempts: state === 'pending' ? 0 : 1,
      error: state === 'failed' ? 'bounced' : null,
      sentAt: null,
      mailLogId: null,
    });
  });

  return job;
};

/** Let a fire-and-forget drain (createJob, resumeJob) run to completion. */
const settle = async (prisma: any) => {
  for (let turn = 0; turn < 500; turn++) {
    await new Promise(resolve => setImmediate(resolve));

    const busy = prisma.jobs.some(
      (job: any) => job.status === 'queued' || job.status === 'running'
    );

    if (!busy) {
      return;
    }
  }
};

describe('MailSendJobService', () => {
  describe('sendToUser', () => {
    it('sends the mail, records the queue entry and marks the job done', async () => {
      const prisma = fakePrisma();
      const mailContext = { sendMail: jest.fn(async () => undefined) };

      const result = await makeService(prisma, mailContext).sendToUser(
        'tpl-1',
        'u1',
        'editor-1'
      );

      expect(mailContext.sendMail).toHaveBeenCalledTimes(1);
      expect(
        (mailContext.sendMail as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        mailTemplateId: 'tpl-1',
        mailType: mailLogType.Manual,
        optionalData: {},
      });
      expect(result.status).toBe('done');
      expect(result.sentCount).toBe(1);
      expect(prisma.entries[0]).toMatchObject({ state: 'sent', attempts: 1 });
    });

    it('rejects an unknown user', async () => {
      const prisma = fakePrisma();
      prisma.user.findUnique = jest.fn(async () => null) as any;

      await expect(
        makeService(prisma).sendToUser('tpl-1', 'u1', 'editor-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('marks the job failed when delivery throws', async () => {
      const prisma = fakePrisma();
      const mailContext = {
        sendMail: jest.fn(async () => {
          throw new Error('smtp down');
        }),
      };

      const result = await makeService(prisma, mailContext).sendToUser(
        'tpl-1',
        'u1',
        'editor-1'
      );

      expect(result.status).toBe('failed');
      expect(result.failedCount).toBe(1);
      expect(prisma.entries[0]).toMatchObject({
        state: 'failed',
        error: 'smtp down',
      });
    });
  });

  describe('createJob', () => {
    it('creates a queued job with the recipient count and maps the audience', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);

      const job = await makeService(
        prisma,
        { sendMail: jest.fn(async () => undefined) },
        recipientService
      ).createJob(
        {
          mailTemplateId: 'tpl-1',
          audience: { base: MailRecipientBase.hasSubscription },
        },
        'editor-1'
      );

      expect(job.totalCount).toBe(3);
      expect(job.audience).toBe('filteredSubscriptions');

      await settle(prisma);
    });

    it('sends to every recipient of the audience it resolved', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2']);
      const mailContext = { sendMail: jest.fn(async () => undefined) };

      await makeService(prisma, mailContext, recipientService).createJob(
        { mailTemplateId: 'tpl-1', audience },
        'editor-1'
      );
      await settle(prisma);

      expect(mailContext.sendMail).toHaveBeenCalledTimes(2);
      expect(prisma.jobs[0].status).toBe('done');
    });
  });

  describe('drain', () => {
    it('materialises the queue, sends to everyone once and finishes', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);
      const mailContext = { sendMail: jest.fn(async () => undefined) };
      seedJob(prisma);

      await makeService(prisma, mailContext, recipientService).drain();

      expect(mailContext.sendMail).toHaveBeenCalledTimes(3);
      expect(prisma.entries.map((entry: any) => entry.state)).toEqual([
        'sent',
        'sent',
        'sent',
      ]);
      expect(prisma.jobs[0]).toMatchObject({
        status: 'done',
        sentCount: 3,
        failedCount: 0,
        totalCount: 3,
      });
    });

    it('records the failure on the queue entry and keeps going', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2']);
      const mailContext = {
        sendMail: jest
          .fn()
          .mockRejectedValueOnce(new Error('bounced'))
          .mockResolvedValueOnce(undefined),
      };
      seedJob(prisma);

      await makeService(prisma, mailContext, recipientService).drain();

      expect(prisma.entries[0]).toMatchObject({
        state: 'failed',
        error: 'bounced',
      });
      expect(prisma.entries[1]).toMatchObject({ state: 'sent' });
      expect(prisma.jobs[0]).toMatchObject({
        status: 'done',
        sentCount: 1,
        failedCount: 1,
      });
    });

    it('never sends to a recipient a second time when the job runs again', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);
      const mailContext = { sendMail: jest.fn(async () => undefined) };
      const service = makeService(prisma, mailContext, recipientService);
      seedJob(prisma);

      await service.drain();
      // Somebody puts the finished job back into the queue.
      prisma.jobs[0].status = 'queued';
      await service.drain();

      expect(mailContext.sendMail).toHaveBeenCalledTimes(3);
    });

    it('marks the job failed when its template disappears', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1']);
      prisma.mailTemplate.findUnique = jest.fn(async () => null) as any;
      seedJob(prisma);

      await makeService(
        prisma,
        { sendMail: jest.fn() },
        recipientService
      ).drain();

      expect(prisma.jobs[0].status).toBe('failed');
      expect(recipientService.resolvePage).not.toHaveBeenCalled();
    });

    it('does not process a job another worker is already running', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1']);
      seedJob(prisma, { status: 'running', heartbeatAt: new Date() });

      await makeService(
        prisma,
        { sendMail: jest.fn() },
        recipientService
      ).drain();

      expect(recipientService.resolvePage).not.toHaveBeenCalled();
    });
  });

  describe('interrupted jobs', () => {
    it('continues a job whose worker went away, skipping what was sent', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);
      const mailContext = { sendMail: jest.fn(async () => undefined) };
      seedJob(prisma, {
        status: 'running',
        resolved: true,
        states: ['sent', 'pending', 'pending'],
        heartbeatAt: new Date(Date.now() - 60 * 60 * 1000),
      });

      await makeService(prisma, mailContext, recipientService).drain();

      expect(mailContext.sendMail).toHaveBeenCalledTimes(2);
      expect(prisma.entries.map((entry: any) => entry.state)).toEqual([
        'sent',
        'sent',
        'sent',
      ]);
      expect(prisma.jobs[0]).toMatchObject({ status: 'done', sentCount: 3 });
    });

    it('does not rebuild the queue of a job it continues', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2']);
      seedJob(prisma, {
        status: 'running',
        resolved: true,
        states: ['sent', 'pending'],
        heartbeatAt: new Date(Date.now() - 60 * 60 * 1000),
      });

      await makeService(
        prisma,
        { sendMail: jest.fn(async () => undefined) },
        recipientService
      ).drain();

      expect(recipientService.resolvePage).not.toHaveBeenCalled();
      expect(prisma.entries).toHaveLength(2);
    });

    it('gives up on a job that keeps dying instead of looping forever', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1']);
      seedJob(prisma, {
        status: 'running',
        resolved: true,
        states: ['pending'],
        heartbeatAt: new Date(Date.now() - 60 * 60 * 1000),
        resumeCount: 5,
      });

      await makeService(
        prisma,
        { sendMail: jest.fn() },
        recipientService
      ).drain();

      expect(prisma.jobs[0].status).toBe('failed');
      expect(prisma.jobs[0].error).toMatch(/interrupted repeatedly/);
    });
  });

  describe('resumeJob', () => {
    const stopped = (prisma: any) =>
      seedJob(prisma, {
        status: 'cancelled',
        resolved: true,
        states: ['sent', 'failed', 'pending'],
      });

    it('sends only what was never attempted', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);
      const mailContext = { sendMail: jest.fn(async () => undefined) };
      const job = stopped(prisma);

      await makeService(prisma, mailContext, recipientService).resumeJob(
        job.id
      );
      await settle(prisma);

      expect(mailContext.sendMail).toHaveBeenCalledTimes(1);
      expect(prisma.entries.map((entry: any) => entry.state)).toEqual([
        'sent',
        'failed',
        'sent',
      ]);
    });

    it('retries the failed ones when asked to', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);
      const mailContext = { sendMail: jest.fn(async () => undefined) };
      const job = stopped(prisma);

      await makeService(prisma, mailContext, recipientService).resumeJob(
        job.id,
        true
      );
      await settle(prisma);

      expect(mailContext.sendMail).toHaveBeenCalledTimes(2);
      expect(prisma.entries.every((entry: any) => entry.state === 'sent')).toBe(
        true
      );
    });

    it('refuses to resume a job that is still running', async () => {
      const prisma = fakePrisma();
      const job = seedJob(prisma, { status: 'running', resolved: true });

      await expect(
        makeService(prisma, undefined, recipientServiceFor([])).resumeJob(
          job.id
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelJob', () => {
    it('stops the job and leaves the rest of the queue open', async () => {
      const prisma = fakePrisma();
      const recipientService = recipientServiceFor(['u1', 'u2', 'u3']);
      seedJob(prisma);

      const service: MailSendJobService = makeService(
        prisma,
        {
          // Cancelled while the first mail is in flight.
          sendMail: jest.fn(async () => {
            if (prisma.jobs[0].status === 'running') {
              await service.cancelJob(prisma.jobs[0].id);
            }
          }),
        },
        recipientService
      );

      await service.drain();

      expect(prisma.jobs[0].status).toBe('cancelled');
      expect(
        prisma.entries.filter((entry: any) => entry.state === 'pending').length
      ).toBeGreaterThan(0);
    });

    it('refuses to cancel a job that already finished', async () => {
      const prisma = fakePrisma();
      const job = seedJob(prisma, { status: 'done', resolved: true });

      await expect(
        makeService(prisma, undefined, recipientServiceFor([])).cancelJob(
          job.id
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
