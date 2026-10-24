import { FormFields } from '@wepublish/ui/editor';

import { EventScheduleField } from '../schedule/event-schedule-field';
import { OccurrenceList } from './occurrence-list';

export function EventDatesTab({
  eventId,
  now,
}: {
  eventId: string | undefined;
  now: Date;
}) {
  return (
    <FormFields>
      <EventScheduleField now={now} />
      {eventId && <OccurrenceList eventId={eventId} />}
    </FormFields>
  );
}
