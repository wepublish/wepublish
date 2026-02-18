import { TableCell } from '@mui/material';
import styled from '@emotion/styled';
import {
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { DraggableSubscriptionInterval } from '../draggable-subscription-interval';
import { DroppableSubscriptionInterval } from '../droppable-subscription-interval';
import {
  DecoratedSubscriptionInterval,
  IntervalColoring,
  MailTemplatesContext,
  NonUserActionInterval,
} from '../subscription-flow-list';

const TableCellBottom = styled(TableCell)`
  vertical-align: bottom;
`;

interface TimelineBodyProps {
  days: (number | null | undefined)[];
  subscriptionFlow: SubscriptionFlowFragment;
  eventIcons: Record<string, JSX.Element>;
  eventColors: Record<string, IntervalColoring>;
}

export function TimelineBody({
  days,
  subscriptionFlow,
  eventIcons,
  eventColors,
}: TimelineBodyProps) {
  const mailTemplates = useContext(MailTemplatesContext);
  const { t } = useTranslation();

  const nonUserActionIntervalsFor = function (
    subscriptionFlow: SubscriptionFlowFragment,
    days: number
  ): DecoratedSubscriptionInterval<NonUserActionInterval>[] {
    const intervals = subscriptionFlow.intervals.filter(
      interval => interval.daysAwayFromEnding === days
    );

    return intervals.map(i => {
      return {
        title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
        subscriptionFlowId: subscriptionFlow.id,
        object: i,
        icon: eventIcons[i.event.toUpperCase()],
        color: eventColors[i.event.toUpperCase()],
      };
    }) as DecoratedSubscriptionInterval<NonUserActionInterval>[];
  };

  return (
    // Not useless in this case
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {days &&
        mailTemplates &&
        days.map(day => {
          const currentIntervals = nonUserActionIntervalsFor(
            subscriptionFlow,
            day!
          );
          // no interval
          if (currentIntervals.length === 0) {
            return (
              <TableCellBottom
                key={`day-${day}`}
                align="center"
                style={day === 0 ? { backgroundColor: 'lightyellow' } : {}}
              >
                <DroppableSubscriptionInterval dayIndex={day ?? 0}>
                  <DraggableSubscriptionInterval
                    mailTemplates={mailTemplates}
                    subscriptionInterval={undefined}
                    subscriptionFlow={subscriptionFlow}
                    event={SubscriptionEvent.Custom}
                    newDaysAwayFromEnding={day as number}
                  />
                </DroppableSubscriptionInterval>
              </TableCellBottom>
            );
          }

          // some intervals
          return (
            <TableCellBottom
              key={`day-${day}`}
              align="center"
              style={day === 0 ? { backgroundColor: 'lightyellow' } : {}}
            >
              <DroppableSubscriptionInterval dayIndex={day ?? 0}>
                {currentIntervals.map(currentInterval => (
                  <DraggableSubscriptionInterval
                    subscriptionInterval={currentInterval}
                    subscriptionFlow={subscriptionFlow}
                    mailTemplates={mailTemplates}
                  />
                ))}
              </DroppableSubscriptionInterval>
            </TableCellBottom>
          );
        })}
    </>
  );
}
