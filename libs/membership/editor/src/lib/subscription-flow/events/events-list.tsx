import { SubscriptionFlowFragment } from '@wepublish/editor/api';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { EventList, EventRow } from '../../mail-settings-layout';
import { decorateInterval } from '../interval-decoration';
import { MailTemplateSelect } from '../mail-template-select';
import {
  MailTemplatesContext,
  UserActionEvent,
  UserActionInterval,
} from '../subscription-flow-list';

interface EventsListProps {
  userActionEvents: UserActionEvent[];
  subscriptionFlow: SubscriptionFlowFragment;
}

export function EventsList({
  userActionEvents,
  subscriptionFlow,
}: EventsListProps) {
  const { t } = useTranslation();
  const mailTemplates = useContext(MailTemplatesContext);

  function intervalForEvent(event: UserActionEvent) {
    const interval = subscriptionFlow.intervals.find(
      interval => interval.event === event.subscriptionEventKey
    );

    return (
      interval &&
      decorateInterval(
        interval as UserActionInterval,
        subscriptionFlow.id,
        event.title
      )
    );
  }

  return (
    <EventList>
      {userActionEvents.map(event => (
        <EventRow
          key={event.subscriptionEventKey}
          title={event.title}
          hint={event.hint}
          description={event.description}
          example={event.example}
        >
          <MailTemplateSelect
            mailTemplates={mailTemplates}
            subscriptionInterval={intervalForEvent(event)}
            subscriptionFlow={subscriptionFlow}
            event={event.subscriptionEventKey}
          />
        </EventRow>
      ))}
    </EventList>
  );
}
