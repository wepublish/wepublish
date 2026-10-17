import {
  MailAudienceInput,
  MailChannel,
  MailEmailSegment,
  MailHistoryCondition,
  MailHistoryMatch,
  MailLogState,
  MailRecipientBase,
  MailSubscriptionState,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { useCallback, useMemo, useState } from 'react';

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
  isPaid: TriState;
  isCanceled: TriState;
  hasReplaced: TriState;
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
  isPaid: 'any',
  isCanceled: 'any',
  hasReplaced: 'any',
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

const toMailHistory = (
  history: AudienceFilterState['mailHistory']
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
      from: row.from ? row.from.toISOString() : undefined,
      to: endOfDay(row.to),
    }));

  return conditions.length ? { match: history.match, conditions } : undefined;
};

/** The API input for the state, exactly as the send page has always built it. */
export function toAudienceInput(state: AudienceFilterState): MailAudienceInput {
  // Applies to every base: who can still be reached by mail at all, and what
  // they were sent so far.
  const emailSegments =
    state.emailSegments.length ? state.emailSegments : undefined;
  const mailHistory = toMailHistory(state.mailHistory);

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
    startsAtFrom:
      state.startsAtFrom ? state.startsAtFrom.toISOString() : undefined,
    startsAtTo: endOfDay(state.startsAtTo),
    endsAtFrom: state.endsAtFrom ? state.endsAtFrom.toISOString() : undefined,
    endsAtTo: endOfDay(state.endsAtTo),
    isPaid: triState(state.isPaid),
    isCanceled: triState(state.isCanceled),
    hasReplacedSubscription: triState(state.hasReplaced),
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
