import {useContext, useMemo} from 'react'
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment
} from '@wepublish/editor/api-v2'
import {SelectPicker} from 'rsuite'
import {GraphqlClientContext} from './graphqlClientContext'
import {
  DecoratedSubscriptionInterval,
  NonUserActionInterval,
  UserActionInterval
} from './subscriptionFlows'

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[]
  subscriptionInterval?: DecoratedSubscriptionInterval<NonUserActionInterval | UserActionInterval>
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

  const updateMailTemplate = async (value: number) => {
    if (subscriptionInterval) {
      await client.updateSubscriptionInterval({
        variables: {
          subscriptionInterval: {
            id: subscriptionInterval.object.id,
            daysAwayFromEnding: subscriptionInterval.object.daysAwayFromEnding,
            mailTemplateId: value
          }
        }
      })
    } else {
      await client.createSubscriptionInterval({
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
      defaultValue={subscriptionInterval?.object.mailTemplate.id}
      onSelect={updateMailTemplate}
    />
  )
}
