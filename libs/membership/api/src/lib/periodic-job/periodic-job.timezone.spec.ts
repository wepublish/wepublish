import { PrismaClient } from '@prisma/client';
import { runInThisContext } from 'vm';
import { PeriodicJobService } from './periodic-job.service';

const hostProcessEnv: NodeJS.ProcessEnv = runInThisContext('process.env');

type JobRow = {
  id: string;
  date: Date;
  executionTime: Date | null;
  successfullyFinished: Date | null;
  finishedWithError: Date | null;
  tries: number;
  error: string | null;
};

const dbDay = (date: Date) => date.toISOString().slice(0, 10);

class PeriodicJobTable {
  rows = new Map<string, JobRow>();

  seed(day: string, row: Partial<JobRow>) {
    const stored: JobRow = {
      id: `job-${day}`,
      date: new Date(`${day}T00:00:00.000Z`),
      executionTime: null,
      successfullyFinished: null,
      finishedWithError: null,
      tries: 0,
      error: null,
      ...row,
    };
    this.rows.set(day, stored);

    return stored;
  }

  findFirst = async () =>
    [...this.rows.values()].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )[0] ?? null;

  create = async ({ data }: { data: Partial<JobRow> & { date: Date } }) => {
    const day = dbDay(data.date);

    if (this.rows.has(day)) {
      throw Object.assign(new Error('Unique constraint failed on date'), {
        code: 'P2002',
      });
    }

    return this.seed(day, { ...data, date: new Date(`${day}T00:00:00.000Z`) });
  };

  update = async ({
    where,
    data,
  }: {
    where: { date?: Date; id?: string };
    data: Partial<JobRow>;
  }) => {
    const row =
      where.date ?
        this.rows.get(dbDay(where.date))
      : [...this.rows.values()].find(candidate => candidate.id === where.id);

    if (!row) {
      throw Object.assign(new Error('Record to update not found'), {
        code: 'P2025',
      });
    }

    Object.assign(row, data);

    return row;
  };
}

describe('PeriodicJobService outside UTC', () => {
  let jobs: PeriodicJobTable;
  let service: PeriodicJobService;
  const previousTimeZone = hostProcessEnv['TZ'];

  beforeAll(() => {
    hostProcessEnv['TZ'] = 'Europe/Zurich';
  });

  afterAll(() => {
    if (previousTimeZone === undefined) {
      delete hostProcessEnv['TZ'];
    } else {
      hostProcessEnv['TZ'] = previousTimeZone;
    }
  });

  const start = async (now: string) => {
    jest.setSystemTime(new Date(now));
    const runs = await service['getOutstandingRuns'](new Date());

    for (const run of runs) {
      if (run.isRetry) {
        await service['retryFailedJob'](run.date);
      } else {
        await service['markJobStarted'](run.date);
      }

      await service['markJobSuccessful']();
    }

    return runs;
  };

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jobs = new PeriodicJobTable();
    service = new PeriodicJobService(
      { periodicJob: jobs } as unknown as PrismaClient,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs on Zurich time', () => {
    expect(new Date('2026-10-06T01:00:00.000Z').getHours()).toBe(3);
  });

  it('stores the night it ran, not the day before', async () => {
    await start('2026-10-06T01:00:00.000Z');

    expect([...jobs.rows.keys()]).toEqual(['2026-10-06']);
  });

  it('catches up the missed nights without colliding with the last stored one', async () => {
    jobs.seed('2026-10-06', {
      executionTime: new Date('2026-10-06T01:00:00.000Z'),
      successfullyFinished: new Date('2026-10-06T01:01:00.000Z'),
      tries: 1,
    });

    await start('2026-10-09T01:00:00.000Z');

    expect([...jobs.rows.keys()].sort()).toEqual([
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
    ]);
  });

  it('runs nothing twice on the same night', async () => {
    await start('2026-10-06T01:00:00.000Z');

    await expect(start('2026-10-06T05:00:00.000Z')).resolves.toEqual([]);
    expect([...jobs.rows.keys()]).toEqual(['2026-10-06']);
  });

  it('retries an aborted night on the row it left behind', async () => {
    jobs.seed('2026-10-06', {
      executionTime: new Date('2026-10-06T01:00:00.000Z'),
      tries: 0,
    });

    await start('2026-10-06T15:00:00.000Z');

    expect([...jobs.rows.keys()]).toEqual(['2026-10-06']);
    expect(jobs.rows.get('2026-10-06')).toMatchObject({
      successfullyFinished: expect.any(Date),
      tries: 1,
    });
  });

  it('retries a failed night on the row it left behind', async () => {
    jobs.seed('2026-10-05', {
      executionTime: new Date('2026-10-05T01:00:00.000Z'),
      finishedWithError: new Date('2026-10-05T01:02:00.000Z'),
      tries: 1,
      error: 'provider down',
    });

    await start('2026-10-06T01:00:00.000Z');

    expect([...jobs.rows.keys()].sort()).toEqual(['2026-10-05', '2026-10-06']);
    expect(jobs.rows.get('2026-10-05')).toMatchObject({
      successfullyFinished: expect.any(Date),
      tries: 2,
    });
  });
});
