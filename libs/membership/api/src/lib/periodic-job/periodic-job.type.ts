export type PeriodicJobRunObject =
  | { date: Date; isRetry: false }
  | { date: Date; isRetry: true; lastStartedAt: Date | null };
