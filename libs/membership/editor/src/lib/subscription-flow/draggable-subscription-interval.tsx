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
import { CanUpdateSubscriptionFlow } from '@wepublish/permissions';

const DraggableContainer = styled.div<{ accent?: string }>`
  container-type: inline-size;
  position: relative;
  min-width: 0;
  max-width: 640px;

  ${({ accent, theme }) =>
    accent &&
    `
      --interval-accent: ${accent};
      overflow: hidden;
      border: 1px solid ${theme.vars.palette.divider};
      border-radius: calc(${theme.shape.borderRadius}px * 0.75);
      background: ${theme.vars.palette.background.paper};
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
  color: ${({ theme }) => theme.vars.palette.text.primary};
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
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  margin-left: -4px;
  border-radius: 4px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 1px;
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
    CanUpdateSubscriptionFlow.id
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
                  aria-label={t('subscriptionFlow.moveMail', {
                    title: subscriptionInterval.title,
                  })}
                >
                  <MdDragIndicator
                    size={18}
                    aria-hidden
                  />
                </DragHandle>
              )}
              {subscriptionInterval.icon}
              {subscriptionInterval.title}
            </EventTag>
          )}

          <SelectWrapper padded={!!subscriptionInterval && !isCustom}>
            <MailTemplateSelect
              label={
                subscriptionInterval && !isCustom ?
                  subscriptionInterval.title
                : t('subscriptionFlow.dayWithNumber', {
                    day:
                      subscriptionInterval?.object.daysAwayFromEnding ??
                      newDaysAwayFromEnding,
                  })
              }
              mailTemplates={mailTemplates}
              subscriptionInterval={subscriptionInterval}
              subscriptionFlow={subscriptionFlow}
              event={event || subscriptionInterval?.object?.event}
              newDaysAwayFromEnding={newDaysAwayFromEnding}
            />
          </SelectWrapper>

          {(subscriptionInterval ? isCustom : !!onRemove) && (
            <PermissionControl
              qualifyingPermissions={[CanUpdateSubscriptionFlow.id]}
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
