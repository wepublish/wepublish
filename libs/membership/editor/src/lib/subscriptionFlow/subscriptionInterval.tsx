import React, {useContext} from 'react'
import {MailTemplatesContext, SubscriptionNonUserAction} from './subscriptionFlows'
import {FullMailTemplateFragment} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'
import {useDraggable} from '@dnd-kit/core'
import { MdDragIndicator } from 'react-icons/md'

interface SubscriptionIntervalProps {
  subscriptionNonUserAction: SubscriptionNonUserAction
}
export default function SubscriptionInterval({
  subscriptionNonUserAction
}: SubscriptionIntervalProps) {
  const {subscriptionInterval, title, description, subscriptionEventKey} = subscriptionNonUserAction
  const mailTemplates = useContext<FullMailTemplateFragment[]>(MailTemplatesContext)

  // draggable
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `draggable-${subscriptionInterval?.id}`,
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
    <>
      <div
        style={{
          ...draggableStyle,
          marginTop: '5px',
          padding: '5px',
          border: '1px solid black',
          borderRadius: '5px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}>
        <div>
          <span style={{ cursor: 'move' }} ref={setNodeRef} {...listeners} {...attributes}><MdDragIndicator /></span>
          {title}
        </div>
        <div>
          <MailTemplateSelect
            mailTemplates={mailTemplates}
            mailTemplateId={subscriptionInterval?.mailTemplate.id}
          />
        </div>
      </div>
    </>
  )
}
