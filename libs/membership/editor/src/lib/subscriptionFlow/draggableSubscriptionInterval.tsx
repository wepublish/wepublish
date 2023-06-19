import React, {useMemo} from 'react'
import {DecoratedSubscriptionInterval} from './subscriptionFlowList'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment
} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'
import {MdDragIndicator} from 'react-icons/md'
import {useDraggable} from '@dnd-kit/core'
import styled from '@emotion/styled'

import {useAuthorisation} from '@wepublish/ui/editor'

const DraggableContainer = styled.div`
  margin: 3px;
  border-radius: 5px;
  position: relative;
`

const EventTagContainer = styled.div`
  display: flex;
  justify-content: center;
  min-width: 150px;
`

interface DraggableSubscriptionIntervalProps {
  subscriptionInterval?: DecoratedSubscriptionInterval<any>
  newDaysAwayFromEnding?: number
  event?: SubscriptionEvent
  mailTemplates: FullMailTemplateFragment[]
  subscriptionFlow: SubscriptionFlowFragment
}
export default function ({
  subscriptionInterval,
  newDaysAwayFromEnding,
  event,
  mailTemplates,
  subscriptionFlow
}: DraggableSubscriptionIntervalProps) {
  // draggable
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `draggable-${subscriptionInterval?.object?.id}`,
    data: {
      decoratedSubscriptionInterval: subscriptionInterval
    }
  })
  const canUpdateSubscriptionFlow = useAuthorisation('CAN_UPDATE_SUBSCRIPTION_FLOW')
  const isCustom = useMemo(() => {
    return subscriptionInterval?.object.event === SubscriptionEvent.Custom
  }, [subscriptionInterval])

  const draggableStyle = useMemo(() => {
    return transform && !isCustom
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
        }
      : undefined
  }, [isCustom, transform])

  return (
    <DraggableContainer
      style={{
        ...draggableStyle,
        border: `3px solid ${subscriptionInterval?.color?.bg}`
      }}>
      {subscriptionInterval && !isCustom && (
        <EventTagContainer>
          {canUpdateSubscriptionFlow && (
            <div
              style={{cursor: 'move', position: 'absolute', left: 0, top: 0}}
              ref={setNodeRef}
              {...listeners}
              {...attributes}>
              <MdDragIndicator color={subscriptionInterval.color.fg} size={20} />
            </div>
          )}
          <div
            style={{
              width: '100%',
              backgroundColor: subscriptionInterval.color.bg,
              color: subscriptionInterval.color.fg,
              fontSize: '0.9em'
            }}>
            <span>{subscriptionInterval.icon}</span>
            <br />
            {subscriptionInterval.title}
          </div>
        </EventTagContainer>
      )}
      <MailTemplateSelect
        mailTemplates={mailTemplates}
        subscriptionInterval={subscriptionInterval}
        subscriptionFlow={subscriptionFlow}
        event={event || subscriptionInterval?.object?.event}
        newDaysAwayFromEnding={newDaysAwayFromEnding}
      />
    </DraggableContainer>
  )
}
