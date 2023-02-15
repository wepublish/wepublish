import React, {useContext, useMemo} from 'react'
import {
  FullMailTemplateFragment,
  useUpdateSubscriptionIntervalMutation
} from '@wepublish/editor/api-v2'
import {SelectPicker} from 'rsuite'
import {GraphqlClientContext} from './graphqlClientContext'
import {SubscriptionIntervalWithTitle} from './subscriptionFlows'

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[]
  mailTemplateId?: number
  subscriptionInterval: SubscriptionIntervalWithTitle
}

export default function MailTemplateSelect({
  mailTemplates,
  mailTemplateId,
  subscriptionInterval
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

  const updateMailTemplate = async (value: number) => {
    await updateSubscriptionInterval({
      variables: {
        subscriptionInterval: {
          id: subscriptionInterval.id,
          daysAwayFromEnding: subscriptionInterval.daysAwayFromEnding,
          mailTemplateId: value
        }
      }
    })
  }

  return (
    <SelectPicker
      style={{width: '100%'}}
      data={mailTemplates.map(mailTemplate => ({label: mailTemplate.name, value: mailTemplate.id}))}
      disabledItemValues={inactiveMailTemplates.map(mailTemplate => mailTemplate.id)}
      defaultValue={mailTemplateId}
      onSelect={updateMailTemplate}
    />
  )
}
