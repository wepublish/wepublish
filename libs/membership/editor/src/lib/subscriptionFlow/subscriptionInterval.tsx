import React, {useContext, useMemo} from 'react'
import {MailTemplatesContext, SubscriptionNonUserAction} from './subscriptionFlows'
import {
  FullMailTemplateFragment,
  useUpdateSubscriptionIntervalMutation
} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'
import {getApiClientV2} from '../../../../../../apps/editor/src/app/utility'

interface SubscriptionIntervalProps {
  subscriptionNonUserAction: SubscriptionNonUserAction
}
export default function SubscriptionInterval({
  subscriptionNonUserAction,
  updateSubscriptionInterval
}: SubscriptionIntervalProps) {
  const {subscriptionInterval, title, description, subscriptionEventKey} = subscriptionNonUserAction
  const mailTemplates = useContext<FullMailTemplateFragment[]>(MailTemplatesContext)

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
        style={{
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
