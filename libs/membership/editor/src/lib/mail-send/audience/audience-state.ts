import {
  MailAudienceInput,
  MailChannel,
  MailEmailSegment,
  MailHistoryCondition,
  MailHistoryMatch,
  MailHistoryScope,
  MailLogState,
  MailRecipientBase,
  MailSubscriptionState,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { useCallback, useMemo, useState } from 'react';
import { RollingValue } from './date-window-filter';

/** Mirrors the API default for the win-back look-back window. */
export const DEFAULT_ENDED_WITHIN_DAYS = 90;

/** How the author expresses "recently ended": rolling days or a fixed period. */
export type EndedMode = 'days' | 'period';
export type DateRange = [Date, Date];

/** A yes/no filter the author may also leave open. */
export type TriState = 'any' | 'true' | 'false';

/** One "was (not) sent template X" row as the author fills it in. */
export type MailHistoryRow = {
  id: string;
  mailTemplateId: string | null;
  negate: boolean;
  states: MailLogState[];
  channel: MailChannel | null;
  from: Date | null;
  to: Date | null;
  /** A range relative to today; takes the place of from/to while set. */
  rolling: RollingValue | null;
  /** How many such mails it takes, at least. */
  minCount: number;
  /** Only mails about the very subscription the audience selects. */
  onSubscription: boolean;
  /** Only mails about an invoice that is still open. */
  onlyOpenInvoice: boolean;
};

/** The audience as the controls hold it, before it becomes the API input. */
export type AudienceFilterState = {
  base: MailRecipientBase;
  emailSegments: MailEmailSegment[];
  memberPlanIDs: string[];
  subscriptionState: MailSubscriptionState | null;
  autoRenew: TriState;
  paymentMethodID: string | null;
  periodicity: PaymentPeriodicity | null;
  startsAtFrom: Date | null;
  startsAtTo: Date | null;
  endsAtFrom: Date | null;
  endsAtTo: Date | null;
  /** Rolling ranges; each takes the place of its fixed dates while set. */
  startsAtRolling: RollingValue | null;
  endsAtRolling: RollingValue | null;
  isPaid: TriState;
  isCanceled: TriState;
  hasReplaced: TriState;
  /** Imported from another system and not paid for here yet. */
  isLegacy: TriState;
  endedWithinDays: number;
  endedMode: EndedMode;
  endedPeriod: DateRange | null;
  mailHistory: { match: MailHistoryMatch; rows: MailHistoryRow[] };
};

let rowSeq = 0;

export const emptyMailHistoryRow = (): MailHistoryRow => ({
  id: `row-${++rowSeq}`,
  mailTemplateId: null,
  negate: false,
  states: [],
  channel: null,
  from: null,
  to: null,
  rolling: null,
  minCount: 1,
  onSubscription: false,
  onlyOpenInvoice: false,
});

export const INITIAL_AUDIENCE_STATE: AudienceFilterState = {
  base: MailRecipientBase.AllUsers,
  emailSegments: [],
  memberPlanIDs: [],
  subscriptionState: null,
  autoRenew: 'any',
  paymentMethodID: null,
  periodicity: null,
  startsAtFrom: null,
  startsAtTo: null,
  endsAtFrom: null,
  endsAtTo: null,
  startsAtRolling: null,
  endsAtRolling: null,
  isPaid: 'any',
  isCanceled: 'any',
  hasReplaced: 'any',
  isLegacy: 'any',
  endedWithinDays: DEFAULT_ENDED_WITHIN_DAYS,
  endedMode: 'days',
  endedPeriod: null,
  mailHistory: { match: MailHistoryMatch.All, rows: [] },
};

/** The picker returns midnight, so a "to" date is stretched over the whole day. */
export const endOfDay = (date?: Date | null): string | undefined => {
  if (!date) {
    return undefined;
  }

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return end.toISOString();
};

const triState = (value: TriState): boolean | undefined =>
  value === 'any' ? undefined : value === 'true';

/** The bases whose recipients are subscriptions, not just people. */
export const selectsSubscriptions = (base: MailRecipientBase) =>
  base === MailRecipientBase.HasSubscription ||
  base === MailRecipientBase.EndedSubscription;

const toMailHistory = (
  history: AudienceFilterState['mailHistory'],
  base: MailRecipientBase
): MailAudienceInput['mailHistory'] => {
  // A row without a template is still being filled in; it must not turn the
  // whole audience into nobody.
  const conditions: MailHistoryCondition[] = history.rows
    .filter(row => row.mailTemplateId)
    .map(row => ({
      mailTemplateId: row.mailTemplateId as string,
      negate: row.negate,
      states: row.states.length ? row.states : undefined,
      channel: row.channel ?? undefined,
      // Either the rolling range or the fixed dates, never both.
      rolling: row.rolling ?? undefined,
      from: !row.rolling && row.from ? row.from.toISOString() : undefined,
      to: row.rolling ? undefined : endOfDay(row.to),
      minCount: row.minCount > 1 ? row.minCount : undefined,
      // Left out rather than sent as "person": an audience without
      // subscriptions has nothing to bind a mail to.
      scope:
        row.onSubscription && selectsSubscriptions(base) ?
          MailHistoryScope.Subscription
        : undefined,
      onlyOpenInvoice: row.onlyOpenInvoice || undefined,
    }));

  return conditions.length ? { match: history.match, conditions } : undefined;
};

/** The API input for the state, exactly as the send page has always built it. */
export function toAudienceInput(state: AudienceFilterState): MailAudienceInput {
  // Applies to every base: who can still be reached by mail at all, and what
  // they were sent so far.
  const emailSegments =
    state.emailSegments.length ? state.emailSegments : undefined;
  const mailHistory = toMailHistory(state.mailHistory, state.base);

  if (state.base === MailRecipientBase.EndedSubscription) {
    const usePeriod =
      state.endedMode === 'period' && state.endedPeriod?.length === 2;

    return {
      base: state.base,
      emailSegments,
      mailHistory,
      // Either an explicit period or the rolling window — never both, so the
      // backend does not have to guess which one the author meant.
      endedWithinDays: usePeriod ? undefined : state.endedWithinDays,
      endedFrom: usePeriod ? state.endedPeriod?.[0].toISOString() : undefined,
      endedTo: usePeriod ? endOfDay(state.endedPeriod?.[1]) : undefined,
      memberPlanIDs:
        state.memberPlanIDs.length ? state.memberPlanIDs : undefined,
      isLegacy: triState(state.isLegacy),
    };
  }

  if (state.base !== MailRecipientBase.HasSubscription) {
    return { base: state.base, emailSegments, mailHistory };
  }

  return {
    base: state.base,
    emailSegments,
    mailHistory,
    memberPlanIDs: state.memberPlanIDs.length ? state.memberPlanIDs : undefined,
    subscriptionState: state.subscriptionState ?? undefined,
    autoRenew: triState(state.autoRenew),
    paymentMethodID: state.paymentMethodID ?? undefined,
    paymentPeriodicity: state.periodicity ?? undefined,
    // Either the rolling range or the fixed dates, never both.
    startsAtRolling: state.startsAtRolling ?? undefined,
    startsAtFrom:
      !state.startsAtRolling && state.startsAtFrom ?
        state.startsAtFrom.toISOString()
      : undefined,
    startsAtTo: state.startsAtRolling ? undefined : endOfDay(state.startsAtTo),
    endsAtRolling: state.endsAtRolling ?? undefined,
    endsAtFrom:
      !state.endsAtRolling && state.endsAtFrom ?
        state.endsAtFrom.toISOString()
      : undefined,
    endsAtTo: state.endsAtRolling ? undefined : endOfDay(state.endsAtTo),
    isPaid: triState(state.isPaid),
    isCanceled: triState(state.isCanceled),
    hasReplacedSubscription: triState(state.hasReplaced),
    isLegacy: triState(state.isLegacy),
  };
}

/** The audience controls' state and the API input derived from it. */
export function useAudienceState(initial = INITIAL_AUDIENCE_STATE) {
  const [state, setState] = useState<AudienceFilterState>(initial);
  const update = useCallback(
    (patch: Partial<AudienceFilterState>) =>
      setState(current => ({ ...current, ...patch })),
    []
  );
  const audience = useMemo(() => toAudienceInput(state), [state]);

  return { state, update, audience };
}
