import {
  MailAudienceInput,
  MailRollingKind,
  MailRollingRange,
} from './mail-send.model';

const DAY_MS = 24 * 60 * 60 * 1000;

export type DateWindow = { from?: Date; to?: Date };

/**
 * The dates a rolling range means at a given moment. Counted in whole days
 * back or ahead of that moment, not snapped to midnight: "the last 7 days"
 * reaches back exactly a week.
 */
export const rollingToRange = (
  { kind, days }: MailRollingRange,
  now: Date
): DateWindow => {
  const span = Math.max(0, days) * DAY_MS;

  switch (kind) {
    case MailRollingKind.lastDays:
      return { from: new Date(now.getTime() - span), to: now };

    case MailRollingKind.olderThanDays:
      return { from: undefined, to: new Date(now.getTime() - span) };

    case MailRollingKind.nextDays:
      return { from: now, to: new Date(now.getTime() + span) };
  }
};

const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;

/**
 * The audience with every rolling range replaced by the dates it means now.
 * For the record kept of a send or a bulk change: "the last 30 days" would
 * read differently a month later, the dates say what was applied.
 */
export const freezeRollingDates = (
  audience: MailAudienceInput,
  now: Date
): MailAudienceInput => {
  const { startsAtRolling, endsAtRolling, mailHistory, ...rest } = audience;
  const frozen: MailAudienceInput = { ...rest };

  if (startsAtRolling) {
    const { from, to } = rollingToRange(startsAtRolling, now);
    frozen.startsAtFrom = from;
    frozen.startsAtTo = to;
  }

  if (endsAtRolling) {
    const { from, to } = rollingToRange(endsAtRolling, now);
    frozen.endsAtFrom = from;
    frozen.endsAtTo = to;
  }

  if (mailHistory) {
    frozen.mailHistory = {
      ...mailHistory,
      conditions: mailHistory.conditions.map(({ rolling, ...condition }) =>
        rolling ?
          withoutUndefined({ ...condition, ...rollingToRange(rolling, now) })
        : condition
      ),
    };
  }

  return withoutUndefined(frozen);
};
