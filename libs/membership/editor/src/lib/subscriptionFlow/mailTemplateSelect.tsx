import React, {useMemo} from 'react'
import {FullMailTemplateFragment, useUpdateSubscriptionIntervalMutation} from '@wepublish/editor/api-v2'
import {SelectPicker} from 'rsuite'
import { getApiClientV2 } from 'apps/editor/src/app/utility'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[]
  mailTemplateId?: number,
  subscriptionIntervalId: number,
  client: ApolloClient<NormalizedCacheObject>
}

export default function MailTemplateSelect({
  mailTemplates,
  mailTemplateId,
  subscriptionIntervalId,
  client
}: MailTemplateSelectProps) {
  const inactiveMailTemplates = useMemo(
    () => mailTemplates.filter(mailTemplate => mailTemplate.remoteMissing),
    [mailTemplates]
  )

  const [updateSubscriptionInterval, {loading: intervalUpdateLoading}] = useUpdateSubscriptionIntervalMutation({
    client,
    // TODO: onError: showErrors
  })

  const updateMailTemplate = async (value: number) => {
    await updateSubscriptionInterval({
      variables: {
        subscriptionInterval: {
          id: subscriptionIntervalId,
          mailTemplate: {
            id: value
          }
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
