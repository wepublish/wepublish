import { useDraggable } from '@dnd-kit/core';
import styled from '@emotion/styled';
import {
  TinyMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { useContext, useMemo } from 'react';
import { MdDelete, MdDragIndicator } from 'react-icons/md';
import { SubscriptionClientContext } from './graphql-client-context';
import { MailTemplateSelect } from './mail-template-select';
import { DecoratedSubscriptionInterval } from './subscription-flow-list';

import { Tooltip, IconButton } from '@mui/material';
import { PermissionControl, useAuthorisation } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

const DraggableContainer = styled.div<{ accent?: string }>`
  container-type: inline-size;
  position: relative;
  min-width: 0;
  max-width: 640px;

  ${({ accent }) =>
    accent &&
    `
      --interval-accent: ${accent};
      overflow: hidden;
      border: 1px solid var(--rs-border-primary);
      border-radius: var(--rs-radius-md);
      background: var(--rs-bg-card);
      box-shadow: inset 3px 0 0 var(--interval-accent);
    `}
`;

const Entry = styled.div<{ split: boolean }>`
  display: grid;

  ${({ split }) =>
    split ?
      `
      @container (min-width: 460px) {
        grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      }
    `
    : `
      grid-auto-flow: column;
      grid-template-columns: minmax(0, 1fr);
      align-items: center;
      gap: 4px;
    `}
`;

const EventTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 8px;
  background: rgb(from var(--interval-accent) r g b / 12%);
  color: var(--rs-text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-align: left;

  > svg {
    flex-shrink: 0;
    color: var(--interval-accent);
  }
`;

const DragHandle = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  margin-left: -2px;
  color: var(--rs-text-secondary);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`;

const SelectWrapper = styled.div<{ padded: boolean }>`
  align-self: center;
  min-width: 0;
  padding: ${({ padded }) => (padded ? '6px' : 0)};
`;

interface DraggableSubscriptionIntervalProps {
  subscriptionInterval?: DecoratedSubscriptionInterval<any>;
  newDaysAwayFromEnding?: number;
  event?: SubscriptionEvent;
  mailTemplates: TinyMailTemplateFragment[];
  subscriptionFlow: SubscriptionFlowFragment;
  onRemove?: () => void;
}

export function DraggableSubscriptionInterval({
  subscriptionInterval,
  newDaysAwayFromEnding,
  event,
  mailTemplates,
  subscriptionFlow,
  onRemove,
}: DraggableSubscriptionIntervalProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );
  const client = useContext(SubscriptionClientContext);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${subscriptionInterval?.object?.id}`,
    data: {
      decoratedSubscriptionInterval: subscriptionInterval,
    },
  });
  const isCustom = useMemo(() => {
    return subscriptionInterval?.object.event === SubscriptionEvent.Custom;
  }, [subscriptionInterval]);

  const draggableStyle = useMemo(() => {
    return transform && !isCustom ?
        {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: 10,
          boxShadow:
            'inset 3px 0 0 var(--interval-accent), var(--wep-elevated-shadow)',
        }
      : undefined;
  }, [isCustom, transform]);

  return (
    <Tooltip
      title={t('draggableSubscriptionInterval.ignoreDeactivatedSubscriptions')}
    >
      <DraggableContainer
        style={draggableStyle}
        accent={isCustom ? undefined : subscriptionInterval?.color?.accent}
      >
        <Entry split={!!subscriptionInterval && !isCustom}>
          {subscriptionInterval && !isCustom && (
            <EventTag>
              {canUpdateSubscriptionFlow && (
                <DragHandle
                  ref={setNodeRef}
                  {...listeners}
                  {...attributes}
                >
                  <MdDragIndicator size={18} />
                </DragHandle>
              )}
              {subscriptionInterval.icon}
              {subscriptionInterval.title}
            </EventTag>
          )}

          <SelectWrapper padded={!!subscriptionInterval && !isCustom}>
            <MailTemplateSelect
              mailTemplates={mailTemplates}
              subscriptionInterval={subscriptionInterval}
              subscriptionFlow={subscriptionFlow}
              event={event || subscriptionInterval?.object?.event}
              newDaysAwayFromEnding={newDaysAwayFromEnding}
            />
          </SelectWrapper>

          {(subscriptionInterval ? isCustom : !!onRemove) && (
            <PermissionControl
              qualifyingPermissions={['CAN_UPDATE_SUBSCRIPTION_FLOW']}
            >
              <IconButton
                size="small"
                color="error"
                aria-label={t('subscriptionFlow.deleteMail')}
                onClick={() =>
                  subscriptionInterval ?
                    client.deleteSubscriptionInterval({
                      variables: { id: subscriptionInterval.object.id },
                    })
                  : onRemove?.()
                }
              >
                <MdDelete />
              </IconButton>
            </PermissionControl>
          )}
        </Entry>
      </DraggableContainer>
    </Tooltip>
  );
}
