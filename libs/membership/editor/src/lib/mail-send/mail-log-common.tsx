import { MailLogState, MailLogType } from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { Tag } from 'rsuite';

const STATE_COLORS: Record<MailLogState, 'green' | 'yellow' | 'red' | 'blue'> =
  {
    [MailLogState.Submitted]: 'blue',
    [MailLogState.Accepted]: 'blue',
    [MailLogState.Delivered]: 'green',
    [MailLogState.Deferred]: 'yellow',
    [MailLogState.Bounced]: 'red',
    [MailLogState.Rejected]: 'red',
  };

export function MailLogStateTag({ state }: { state: MailLogState }) {
  return <Tag color={STATE_COLORS[state] ?? 'blue'}>{state}</Tag>;
}

export function mailLogTypeLabel(
  type: MailLogType | null | undefined,
  t: TFunction
): string {
  if (!type) {
    return '—';
  }

  return t(`mailLog.types.${type}`);
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '—';
  }

  // Swiss format (DD.MM.YYYY, 24h) regardless of the browser locale, so dates
  // never render US-style with AM/PM.
  return new Date(value).toLocaleString('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
