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
  isNonUserEvent,
  NonUserActionInterval,
  UserActionInterval
} from './subscriptionFlowList'
import {useTranslation} from 'react-i18next'
import {MdDoNotDisturb, MdUnsubscribe} from 'react-icons/all'

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[]
  subscriptionInterval?: DecoratedSubscriptionInterval<NonUserActionInterval | UserActionInterval>
  newDaysAwayFromEnding?: number
  subscriptionFlow: SubscriptionFlowFragment
  event: SubscriptionEvent
}

export default function MailTemplateSelect({
  mailTemplates,
  subscriptionInterval,
  newDaysAwayFromEnding,
  subscriptionFlow,
  event
}: MailTemplateSelectProps) {
  const {t} = useTranslation()
  const inactiveMailTemplates = useMemo(
    () => mailTemplates.filter(mailTemplate => mailTemplate.remoteMissing),
    [mailTemplates]
  )

  const client = useContext(GraphqlClientContext)

  const updateMailTemplate = async (value: number) => {
    if (subscriptionInterval) {
      // MailTemplate existed before, was changed
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
      // No MailTemplate selected previously, must create one
      await client.createSubscriptionInterval({
        variables: {
          subscriptionInterval: {
            daysAwayFromEnding: isNonUserEvent(event) ? newDaysAwayFromEnding || 0 : null,
            mailTemplateId: value,
            subscriptionFlowId: subscriptionFlow.id,
            event
          }
        }
      })
    }
  }

  const deleteMailTemplate = async () => {
    if (!subscriptionInterval) {
      // TODO: show error; this should never happen, because clearing only works when value was selected before (and therefore, an interval existed)
      return
    }
    await client.deleteSubscriptionInterval({
      variables: {
        subscriptionInterval: {
          id: subscriptionInterval.object.id
        }
      }
    })
  }

  return (
    <SelectPicker
      style={{width: '100%'}}
      data={mailTemplates.map(mailTemplate => ({
        label: `${mailTemplate.remoteMissing ? '⚠' : ''} ${mailTemplate.name}`,
        value: mailTemplate.id
      }))}
      disabledItemValues={inactiveMailTemplates.map(mailTemplate => mailTemplate.id)}
      defaultValue={subscriptionInterval?.object.mailTemplate?.id}
      onSelect={updateMailTemplate}
      onClean={deleteMailTemplate}
      placeholder={
        <>
          <MdUnsubscribe size={16} style={{marginRight: '5px'}} />
          {t('mailTemplateSelect.noMailSentSelectNow')}
        </>
      }
    />
  )
}
