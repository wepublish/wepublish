import styled from '@emotion/styled';
import { EditorEventListItemFragment } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdWarningAmber } from 'react-icons/md';

import { eventExpiry } from './event-expiry';
import { formatEventDateTime } from './event-format';

const Wrapper = styled.span`
  display: inline-flex;
  flex-direction: column;
  line-height: 1.3;
`;

const Secondary = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Expiry = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.vars.palette.warning.dark};
`;

export interface EventNextDateProps {
  event: Pick<
    EditorEventListItemFragment,
    'nextOccurrence' | 'upcomingOccurrenceCount' | 'scheduleType' | 'lastDateAt'
  >;
  now: Date;
}

export function EventNextDate({ event, now }: EventNextDateProps) {
  const { t, i18n } = useTranslation();
  const expiry = eventExpiry(event, now);
  const more = event.upcomingOccurrenceCount - 1;

  return (
    <Wrapper>
      {event.nextOccurrence ?
        <span>
          {formatEventDateTime(event.nextOccurrence.dateFrom, i18n.language)}
        </span>
      : <Secondary>{t('agenda.list.noUpcomingDates')}</Secondary>}

      {more > 0 && (
        <Secondary>{t('agenda.list.moreDates', { count: more })}</Secondary>
      )}

      {expiry && (
        <Expiry title={t('agenda.list.endsInHint')}>
          <MdWarningAmber aria-hidden="true" />
          {expiry.daysLeft === 0 ?
            t('agenda.list.endsToday')
          : t('agenda.list.endsIn', { count: expiry.daysLeft })}
        </Expiry>
      )}
    </Wrapper>
  );
}
