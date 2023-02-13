import React, {useContext, useMemo} from 'react'
import {MailTemplatesContext, SubscriptionNonUserAction} from './subscriptionFlows'
import {
  FullMailTemplateFragment,
  useUpdateSubscriptionIntervalMutation
} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'
import {getApiClientV2} from '../../../../../../apps/editor/src/app/utility'
import {useDraggable} from '@dnd-kit/core'

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

  /**
   * API SERVICES
   */
  const client = useMemo(() => getApiClientV2(), [])
  const [updateSubscriptionIntervalMutation, {loading}] = useUpdateSubscriptionIntervalMutation({
    client
  })

  /**
   * FUNCTIONS
   */
  // todo => refetch and find __typename solution
  async function changeMailTemplate(mailTemplateId: number) {
    const updatedInterval = await updateSubscriptionIntervalMutation({
      variables: {
        subscriptionInterval: {
          ...subscriptionInterval,
          mailTemplateId,
          mailTemplate: undefined,
          __typename: undefined
        }
      }
    })
    console.log('updated interval', updatedInterval)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
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
        <div>{title}</div>
        <div>
          <MailTemplateSelect
            mailTemplates={mailTemplates}
            mailTemplateId={subscriptionInterval?.mailTemplate.id}
            onMailTemplateChange={mailTemplateId => changeMailTemplate(mailTemplateId)}
          />
        </div>
      </div>
    </>
  )
}
