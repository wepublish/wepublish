import React, {useContext} from 'react'
import {MailTemplatesContext, SubscriptionIntervalWithTitle} from './subscriptionFlows'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment
} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'
import {useDraggable} from '@dnd-kit/core'
import {MdDragIndicator} from 'react-icons/md'

interface SubscriptionIntervalProps {
  subscriptionInterval: SubscriptionIntervalWithTitle
  subscriptionFlow: SubscriptionFlowFragment
  event: SubscriptionEvent
}
export default function SubscriptionInterval({
  subscriptionInterval,
  subscriptionFlow,
  event
}: SubscriptionIntervalProps) {
  const mailTemplates = useContext<FullMailTemplateFragment[]>(MailTemplatesContext)

  // draggable
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `draggable-${subscriptionInterval.id}`,
    data: {
      subscriptionInterval
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
        ...draggableStyle,
        padding: '5px',
        border: '1px solid black',
        borderRadius: '5px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%'
      }}>
      <div>
        <span style={{cursor: 'move'}} ref={setNodeRef} {...listeners} {...attributes}>
          <MdDragIndicator />
        </span>
        {subscriptionInterval.title}
      </div>
      <div>
        <MailTemplateSelect
          mailTemplates={mailTemplates}
          subscriptionInterval={subscriptionInterval}
          subscriptionFlow={subscriptionFlow}
          event={event}
        />
      </div>
    </div>
  )
}
