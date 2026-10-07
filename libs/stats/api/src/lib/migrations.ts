/**
 * Reading the database's own migration history.
 *
 * Prisma records every migration in `_prisma_migrations` and does not delete the
 * row when one fails — it leaves `finished_at` empty and writes the error into
 * `logs`. A row like that means the schema is half-applied: the deployment ran,
 * the migration did not complete, and nothing will apply the rest until someone
 * resolves it. That is the state this exists to surface.
 */
export type MigrationState = 'applied' | 'failed' | 'rolledBack' | 'running';

export interface MigrationRow {
  id: string;
  migration_name: string;
  started_at: Date | string;
  finished_at: Date | string | null;
  rolled_back_at: Date | string | null;
  applied_steps_count: number;
  logs: string | null;
}

export interface Migration {
  id: string;
  name: string;
  state: MigrationState;
  startedAt: Date;
  finishedAt: Date | null;
  rolledBackAt: Date | null;
  appliedStepsCount: number;
  error: string | null;
}

/** How long a migration may be unfinished before it counts as stuck, not running. */
export const RUNNING_GRACE_MS = 15 * 60 * 1000;

const toDate = (value: Date | string | null): Date | null =>
  value ? new Date(value) : null;

export function classifyMigration(
  row: MigrationRow,
  now: Date = new Date()
): MigrationState {
  if (row.rolled_back_at) {
    return 'rolledBack';
  }

  if (row.finished_at) {
    return 'applied';
  }

  // Unfinished: still going, or abandoned. A deployment that died mid-migration
  // leaves exactly this row, so it must not stay "running" forever.
  const started = toDate(row.started_at)?.getTime() ?? 0;

  return now.getTime() - started <= RUNNING_GRACE_MS ? 'running' : 'failed';
}

export function toMigration(row: MigrationRow, now?: Date): Migration {
  return {
    id: row.id,
    name: row.migration_name,
    state: classifyMigration(row, now),
    startedAt: toDate(row.started_at) as Date,
    finishedAt: toDate(row.finished_at),
    rolledBackAt: toDate(row.rolled_back_at),
    appliedStepsCount: row.applied_steps_count ?? 0,
    error: row.logs?.trim() ? row.logs.trim().slice(0, 2000) : null,
  };
}

export interface MigrationSummary {
  /** Distinct migrations, not attempts. */
  total: number;
  applied: number;
  failed: number;
  rolledBack: number;
  running: number;
  /** Attempts that were rolled back but whose migration later succeeded. */
  retriedAttempts: number;
  lastMigrationName: string | null;
  lastMigrationState: MigrationState | null;
  lastAppliedAt: Date | null;
  /**
   * True when the newest migration has no successful attempt. The database is
   * then in a state nobody designed: part of a schema change applied, the rest
   * not, and nothing applies the rest until someone resolves it.
   */
  lastMigrationFailed: boolean;
}

/**
 * Prisma writes one row per ATTEMPT, so a migration that failed twice and then
 * succeeded appears three times. What matters is the migration, not the
 * attempt: if any attempt of a name succeeded, that migration is applied and
 * the earlier rows are history.
 */
export function groupByName(migrations: Migration[]): Map<string, Migration[]> {
  const byName = new Map<string, Migration[]>();

  for (const migration of migrations) {
    const attempts = byName.get(migration.name) ?? [];

    attempts.push(migration);
    byName.set(migration.name, attempts);
  }

  for (const attempts of byName.values()) {
    attempts.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  return byName;
}

/** The state of a migration as a whole, across all its attempts. */
export function stateOfMigration(attempts: Migration[]): MigrationState {
  if (attempts.some(attempt => attempt.state === 'applied')) {
    return 'applied';
  }

  if (attempts.some(attempt => attempt.state === 'running')) {
    return 'running';
  }

  // Newest attempt decides between failed and rolled back. Sorted here rather
  // than trusting the caller: the answer must not depend on argument order.
  const newest = [...attempts].sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
  )[0];

  return newest?.state ?? 'failed';
}

export function summarise(
  migrations: Migration[],
  now: Date = new Date()
): MigrationSummary {
  const byName = groupByName(migrations);
  const states = [...byName.values()].map(stateOfMigration);
  const count = (state: MigrationState) =>
    states.filter(value => value === state).length;

  const newest = [...migrations].sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
  )[0];
  const newestAttempts = newest ? (byName.get(newest.name) ?? []) : [];
  const newestState = newest ? stateOfMigration(newestAttempts) : null;

  const succeeded = migrations
    .filter(migration => migration.state === 'applied' && migration.finishedAt)
    .sort(
      (a, b) =>
        (b.finishedAt as Date).getTime() - (a.finishedAt as Date).getTime()
    );

  return {
    total: byName.size,
    applied: count('applied'),
    failed: count('failed'),
    rolledBack: count('rolledBack'),
    running: count('running'),
    retriedAttempts: migrations.filter(
      migration =>
        migration.state !== 'applied' &&
        (byName.get(migration.name) ?? []).some(
          attempt => attempt.state === 'applied'
        )
    ).length,
    lastMigrationName: newest?.name ?? null,
    lastMigrationState: newestState,
    lastAppliedAt: succeeded[0]?.finishedAt ?? null,
    lastMigrationFailed:
      newestState === 'failed' || newestState === 'rolledBack',
  };
}
