import React, {useContext, useMemo} from 'react'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment,
  useCreateSubscriptionIntervalMutation,
  useDeleteSubscriptionIntervalMutation,
  useUpdateSubscriptionIntervalMutation
} from '@wepublish/editor/api-v2'
import {SelectPicker} from 'rsuite'
import {GraphqlClientContext} from './graphqlClientContext'
import {SubscriptionIntervalWithTitle} from './subscriptionFlows'

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[]
  subscriptionInterval?: SubscriptionIntervalWithTitle
  subscriptionFlow: SubscriptionFlowFragment
  event: SubscriptionEvent
}

export default function MailTemplateSelect({
  mailTemplates,
  subscriptionInterval,
  subscriptionFlow,
  event
}: MailTemplateSelectProps) {
  const inactiveMailTemplates = useMemo(
    () => mailTemplates.filter(mailTemplate => mailTemplate.remoteMissing),
    [mailTemplates]
  )

  const client = useContext(GraphqlClientContext)

  const [updateSubscriptionInterval] = useUpdateSubscriptionIntervalMutation({
    client
    // TODO: onError: showErrors
  })

  const [createSubscriptionInterval] = useCreateSubscriptionIntervalMutation({
    client
    // TODO: onError: showErrors
  })

  const [deleteSubscriptionInterval] = useDeleteSubscriptionIntervalMutation({
    client
  })

  const updateMailTemplate = async (value: number) => {
    if (subscriptionInterval) {
      await updateSubscriptionInterval({
        variables: {
          subscriptionInterval: {
            id: subscriptionInterval.id,
            daysAwayFromEnding: subscriptionInterval.daysAwayFromEnding,
            mailTemplateId: value
          }
        }
      })
    } else {
      await createSubscriptionInterval({
        variables: {
          subscriptionInterval: {
            daysAwayFromEnding: 0,
            mailTemplateId: value,
            subscriptionFlowId: subscriptionFlow.id,
            event
          }
        }
      })
    }
  }

  return (
    <SelectPicker
      style={{width: '100%'}}
      data={mailTemplates.map(mailTemplate => ({label: mailTemplate.name, value: mailTemplate.id}))}
      disabledItemValues={inactiveMailTemplates.map(mailTemplate => mailTemplate.id)}
      defaultValue={subscriptionInterval?.mailTemplate.id}
      onSelect={updateMailTemplate}
    />
  )
}
