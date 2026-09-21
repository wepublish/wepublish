import {
  RUNNING_GRACE_MS,
  classifyMigration,
  stateOfMigration,
  summarise,
  toMigration,
  type MigrationRow,
} from './migrations';

const now = new Date('2026-09-17T12:00:00.000Z');
const ago = (ms: number) => new Date(now.getTime() - ms);

const row = (overrides: Partial<MigrationRow> = {}): MigrationRow => ({
  id: 'id-1',
  migration_name: '20260917090000_add_impersonation',
  started_at: ago(60_000),
  finished_at: ago(59_000),
  rolled_back_at: null,
  applied_steps_count: 1,
  logs: null,
  ...overrides,
});

describe('classifyMigration', () => {
  it('counts a finished migration as applied', () => {
    expect(classifyMigration(row(), now)).toBe('applied');
  });

  it('counts a rolled back migration as such, even if it had finished', () => {
    expect(classifyMigration(row({ rolled_back_at: ago(1000) }), now)).toBe(
      'rolledBack'
    );
  });

  it('treats a recently started, unfinished migration as running', () => {
    expect(
      classifyMigration(
        row({ finished_at: null, started_at: ago(30_000) }),
        now
      )
    ).toBe('running');
  });

  it('treats an unfinished migration past the grace period as failed — a deployment that died mid-migration leaves exactly this', () => {
    expect(
      classifyMigration(
        row({ finished_at: null, started_at: ago(RUNNING_GRACE_MS + 1000) }),
        now
      )
    ).toBe('failed');
  });
});

describe('toMigration', () => {
  it('carries the error Prisma wrote into logs', () => {
    const migration = toMigration(
      row({
        finished_at: null,
        started_at: ago(RUNNING_GRACE_MS * 2),
        logs: '  relation "Foo" does not exist  ',
      }),
      now
    );

    expect(migration.state).toBe('failed');
    expect(migration.error).toBe('relation "Foo" does not exist');
  });

  it('reports no error for a clean migration', () => {
    expect(toMigration(row(), now).error).toBeNull();
    expect(toMigration(row({ logs: '   ' }), now).error).toBeNull();
  });

  it('caps a runaway log so one migration cannot flood the response', () => {
    const migration = toMigration(row({ logs: 'x'.repeat(5000) }), now);

    expect(migration.error?.length).toBe(2000);
  });
});

describe('summarise', () => {
  const applied = (name: string, at: Date) =>
    toMigration(
      row({
        id: `${name}-ok`,
        migration_name: name,
        started_at: at,
        finished_at: at,
      }),
      now
    );
  const failed = (name: string, at: Date, id = `${name}-fail`) =>
    toMigration(
      row({
        id,
        migration_name: name,
        started_at: at,
        finished_at: null,
        logs: 'boom',
      }),
      now
    );
  const rolledBack = (name: string, at: Date, id = `${name}-rb`) =>
    toMigration(
      row({
        id,
        migration_name: name,
        started_at: at,
        finished_at: null,
        rolled_back_at: at,
        logs: 'deadlock detected',
      }),
      now
    );

  const hours = (n: number) => ago(n * 60 * 60 * 1000);

  it('counts migrations, not attempts', () => {
    const summary = summarise(
      [applied('a', hours(3)), applied('b', hours(2)), failed('c', hours(1))],
      now
    );

    expect(summary).toMatchObject({ total: 3, applied: 2, failed: 1 });
  });

  it('treats a migration that was retried and finally succeeded as applied', () => {
    // The real case: three rolled-back attempts, then a successful one.
    const summary = summarise(
      [
        rolledBack('timezones', hours(6), 'r1'),
        rolledBack('timezones', hours(5), 'r2'),
        rolledBack('timezones', hours(4), 'r3'),
        applied('timezones', hours(3)),
      ],
      now
    );

    expect(summary).toMatchObject({
      total: 1,
      applied: 1,
      rolledBack: 0,
      failed: 0,
      retriedAttempts: 3,
      lastMigrationFailed: false,
      lastMigrationState: 'applied',
    });
  });

  it('flags the newest migration having no successful attempt', () => {
    const summary = summarise(
      [applied('a', hours(3)), failed('b', hours(1))],
      now
    );

    expect(summary.lastMigrationFailed).toBe(true);
    expect(summary.lastMigrationName).toBe('b');
    expect(summary.lastMigrationState).toBe('failed');
  });

  it('does not flag an older migration that failed once and then applied', () => {
    const summary = summarise(
      [failed('a', hours(3)), applied('a', hours(2)), applied('b', hours(1))],
      now
    );

    expect(summary.lastMigrationFailed).toBe(false);
    expect(summary.failed).toBe(0);
    expect(summary.total).toBe(2);
  });

  it('reports the newest successful timestamp, empty when nothing ever applied', () => {
    expect(summarise([applied('a', hours(1))], now).lastAppliedAt).toEqual(
      hours(1)
    );
    expect(summarise([failed('a', hours(1))], now).lastAppliedAt).toBeNull();
  });

  it('treats a newest migration rolled back with no retry as a failure', () => {
    expect(
      summarise([rolledBack('r', hours(1))], now).lastMigrationFailed
    ).toBe(true);
  });

  it('answers for a database with no migrations at all', () => {
    expect(summarise([], now)).toMatchObject({
      total: 0,
      lastMigrationName: null,
      lastMigrationFailed: false,
      lastAppliedAt: null,
      retriedAttempts: 0,
    });
  });
});

describe('stateOfMigration', () => {
  const attempt = (
    state: 'applied' | 'failed' | 'rolledBack',
    id: string,
    at: Date
  ) =>
    toMigration(
      row({
        id,
        migration_name: 'm',
        started_at: at,
        finished_at: state === 'applied' ? at : null,
        rolled_back_at: state === 'rolledBack' ? at : null,
      }),
      now
    );

  it('is applied as soon as any attempt succeeded, whatever came before', () => {
    expect(
      stateOfMigration([
        attempt('applied', '2', ago(RUNNING_GRACE_MS * 2)),
        attempt('rolledBack', '1', ago(RUNNING_GRACE_MS * 3)),
      ])
    ).toBe('applied');
  });

  it('otherwise follows the newest attempt', () => {
    expect(
      stateOfMigration([
        attempt('failed', '2', ago(RUNNING_GRACE_MS * 2)),
        attempt('rolledBack', '1', ago(RUNNING_GRACE_MS * 3)),
      ])
    ).toBe('failed');
  });

  it('counts a migration with an attempt still running as running, not failed', () => {
    expect(
      stateOfMigration([
        attempt('failed', '1', ago(RUNNING_GRACE_MS * 3)),
        // Started seconds ago: a retry in progress, not another failure.
        attempt('failed', '2', ago(1000)),
      ])
    ).toBe('running');
  });

  it('does not depend on the order it is handed the attempts', () => {
    const newest = attempt('failed', '2', ago(RUNNING_GRACE_MS * 2));
    const older = attempt('rolledBack', '1', ago(RUNNING_GRACE_MS * 3));

    expect(stateOfMigration([older, newest])).toBe('failed');
    expect(stateOfMigration([newest, older])).toBe('failed');
  });
});
