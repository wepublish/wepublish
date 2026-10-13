import { DndContext, DragEndEvent } from '@dnd-kit/core';
import styled from '@emotion/styled';
import { SubscriptionFlowFragment } from '@wepublish/editor/api';
import { ReactNode, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCelebration, MdFilterAlt } from 'react-icons/md';
import { MailBlock, MailSubsection } from '../mail-settings-layout';
import { DeleteSubscriptionFlow } from './delete-subscription-flow';
import { EventsList } from './events/events-list';
import { SubscriptionClientContext } from './graphql-client-context';
import { droppedInterval, withMovedIntervals } from './interval-decoration';
import { UserActionEvent } from './subscription-flow-list';
import { Timeline } from './timeline/timeline';

const AffectedCount = styled('span')<{ empty: boolean }>`
  --affected-color: ${({ empty }) =>
    empty ? 'var(--rs-state-error)' : 'var(--rs-state-success)'};
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background-color: rgb(from var(--affected-color) r g b / 12%);
  color: var(--affected-color);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
`;

interface FlowBlockProps {
  subscriptionFlow: SubscriptionFlowFragment;
  userActionEvents: UserActionEvent[];
  title: string;
  icon?: ReactNode;
  description?: string;
  example?: string;
  filters?: ReactNode;
  summary?: ReactNode;
  showAffected?: boolean;
  groupEvents?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function FlowBlock({
  subscriptionFlow,
  userActionEvents,
  title,
  icon,
  description,
  example,
  filters,
  summary,
  showAffected,
  groupEvents,
  collapsible,
  defaultExpanded,
}: FlowBlockProps) {
  const { t } = useTranslation();
  const client = useContext(SubscriptionClientContext);

  const [movedIntervals, setMovedIntervals] = useState<Record<string, number>>(
    {}
  );

  const displayedFlow = useMemo(
    () => ({
      ...subscriptionFlow,
      intervals: withMovedIntervals(subscriptionFlow.intervals, movedIntervals),
    }),
    [subscriptionFlow, movedIntervals]
  );

  async function intervalDragEnd(dragEvent: DragEndEvent) {
    const dropped = droppedInterval(dragEvent);

    if (!dropped) {
      return;
    }

    const { interval, day } = dropped;

    setMovedIntervals(moved => ({ ...moved, [interval.id]: day }));

    try {
      await client.updateSubscriptionInterval({
        variables: {
          id: interval.id,
          daysAwayFromEnding: day,
          mailTemplateId: interval.mailTemplate?.id,
        },
      });
    } finally {
      setMovedIntervals(({ [interval.id]: _, ...moved }) => moved);
    }
  }

  return (
    <MailBlock
      title={title}
      icon={icon}
      description={description}
      example={example}
      summary={summary}
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
      actions={
        showAffected && (
          <>
            <AffectedCount empty={!subscriptionFlow.numberOfSubscriptions}>
              {t('subscriptionFlow.subscriptionsAffected', {
                numberOfSubscriptions: subscriptionFlow.numberOfSubscriptions,
              })}
            </AffectedCount>

            {!subscriptionFlow.default && (
              <DeleteSubscriptionFlow subscriptionFlow={subscriptionFlow} />
            )}
          </>
        )
      }
    >
      <DndContext
        onDragEnd={intervalDragEnd}
        accessibility={{ container: document.body }}
      >
        {filters && (
          <MailSubsection
            title={t('subscriptionFlow.filters')}
            icon={<MdFilterAlt size={16} />}
            description={t('subscriptionFlow.filtersDescription')}
            example={t('subscriptionFlow.filtersExample')}
          >
            {filters}
          </MailSubsection>
        )}

        <MailSubsection
          {...(groupEvents && {
            title: t('subscriptionFlow.subscriptionEvents'),
            icon: <MdCelebration size={16} />,
            description: t('subscriptionFlow.subscriptionEventsDescription'),
            example: t('subscriptionFlow.subscriptionEventsExample'),
          })}
        >
          <EventsList
            userActionEvents={userActionEvents}
            subscriptionFlow={subscriptionFlow}
          />
        </MailSubsection>

        <Timeline subscriptionFlow={displayedFlow} />
      </DndContext>
    </MailBlock>
  );
}
