import React, {useContext} from 'react'
import {MailTemplatesContext, SubscriptionNonUserAction} from './subscriptionFlows'
import {SelectPicker} from 'rsuite'
import {FullMailTemplateFragment} from '@wepublish/editor/api-v2'
import MailTemplateSelect from './mailTemplateSelect'

interface SubscriptionIntervalProps {
  subscriptionNonUserAction: SubscriptionNonUserAction
}
export default function SubscriptionInterval({
  subscriptionNonUserAction
}: SubscriptionIntervalProps) {
  const {subscriptionInterval, title, description, subscriptionEventKey} = subscriptionNonUserAction
  const mailTemplates = useContext<FullMailTemplateFragment[]>(MailTemplatesContext)

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
          />
        </div>
      </div>
    </>
  )
}
