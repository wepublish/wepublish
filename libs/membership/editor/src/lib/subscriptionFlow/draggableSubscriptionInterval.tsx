import React from 'react'
import {Tag} from 'rsuite'
import {DecoratedSubscriptionInterval} from './subscriptionFlowList'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment
} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'
import {MdDragIndicator} from 'react-icons/all'
import {useDraggable} from '@dnd-kit/core'
import styled from '@emotion/styled'

const EventTagContainer = styled.div`
  display: flex;
  justify-content: center;
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
  if (subscriptionInterval?.object.event === SubscriptionEvent.Custom) {
    return (
      <MailTemplateSelect
        mailTemplates={mailTemplates}
        subscriptionInterval={subscriptionInterval}
        subscriptionFlow={subscriptionFlow}
        event={event || subscriptionInterval?.object?.event}
        newDaysAwayFromEnding={newDaysAwayFromEnding}
      />
    )
  }

  // draggable
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `draggable-${subscriptionInterval?.object?.id}`,
    data: {
      decoratedSubscriptionInterval: subscriptionInterval
    }
  })
  const draggableStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined

  return (
    <div
      style={{
        ...draggableStyle
      }}>
      {subscriptionInterval && subscriptionInterval.object.event !== SubscriptionEvent.Custom && (
        <EventTagContainer>
          <div style={{cursor: 'move'}} ref={setNodeRef} {...listeners} {...attributes}>
            <MdDragIndicator size={20} />
          </div>
          <Tag
            style={{
              color: subscriptionInterval.color.fg,
              marginBottom: '5px'
            }}
            color={subscriptionInterval.color.bg}>
            <span style={{marginRight: '5px'}}>{subscriptionInterval.icon}</span>
            {subscriptionInterval.title}
          </Tag>
        </EventTagContainer>
      )}
      <MailTemplateSelect
        mailTemplates={mailTemplates}
        subscriptionInterval={subscriptionInterval}
        subscriptionFlow={subscriptionFlow}
        event={event || subscriptionInterval?.object?.event}
        newDaysAwayFromEnding={newDaysAwayFromEnding}
      />
    </div>
  )
}
