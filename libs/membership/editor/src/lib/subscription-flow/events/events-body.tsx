import { TableCell } from '@mui/material';
import { SubscriptionFlowFragment } from '@wepublish/editor/api';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MailTemplateSelect } from '../mail-template-select';
import {
  DecoratedSubscriptionInterval,
  IntervalColoring,
  MailTemplatesContext,
  NonUserActionInterval,
  UserActionEvent,
} from '../subscription-flow-list';

interface EventsBodyProps {
  userActionEvents: UserActionEvent[];
  subscriptionFlow: SubscriptionFlowFragment;
  eventIcons: Record<string, JSX.Element>;
  eventColors: Record<string, IntervalColoring>;
}

export function EventsBody({
  userActionEvents,
  subscriptionFlow,
  eventIcons,
  eventColors,
}: EventsBodyProps) {
  const { t } = useTranslation();
  const mailTemplates = useContext(MailTemplatesContext);

  const intervals = useMemo(
    () =>
      subscriptionFlow.intervals.map(
        interval =>
          ({
            title: t(`subscriptionFlow.${interval.event.toLowerCase()}`),
            subscriptionFlowId: subscriptionFlow.id,
            object: interval,
            icon: eventIcons[interval.event.toUpperCase()],
            color: eventColors[interval.event.toUpperCase()],
          }) as DecoratedSubscriptionInterval<NonUserActionInterval>
      ),
    [eventColors, eventIcons, subscriptionFlow, t]
  );

  const intervalForEvent = useCallback(
    (eventName: string) =>
      intervals.find(interval => interval.object.event === eventName),
    [intervals]
  );

  return (
    <>
      {userActionEvents.map(event => (
        <TableCell
          key={event.subscriptionEventKey}
          align="center"
        >
          {mailTemplates && (
            <MailTemplateSelect
              mailTemplates={mailTemplates}
              subscriptionInterval={intervalForEvent(
                event.subscriptionEventKey
              )}
              subscriptionFlow={subscriptionFlow}
              event={event.subscriptionEventKey}
            />
          )}
        </TableCell>
      ))}
    </>
  );
}
