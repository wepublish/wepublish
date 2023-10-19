import React, {useContext} from 'react'
import {TableCell} from '@mui/material'
import MailTemplateSelect from '../mailTemplateSelect'
import {
  DecoratedSubscriptionInterval,
  IntervalColoring,
  MailTemplatesContext,
  NonUserActionInterval,
  UserActionEvent
} from '../subscriptionFlowList'
import {SubscriptionFlowFragment, SubscriptionFlowModel} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'

interface ActionsBodyProps {
  userActionEvents: UserActionEvent[]
  subscriptionFlow: SubscriptionFlowModel
  eventIcons: {[key: string]: JSX.Element}
  eventColors: {[key: string]: IntervalColoring}
}

export default function ({
  userActionEvents,
  subscriptionFlow,
  eventIcons,
  eventColors
}: ActionsBodyProps) {
  const {t} = useTranslation()
  const mailTemplates = useContext(MailTemplatesContext)

  const userActionIntervalFor = function (
    subscriptionFlow: SubscriptionFlowFragment,
    eventName: string
  ): DecoratedSubscriptionInterval<NonUserActionInterval> | undefined {
    const withTitle = subscriptionFlow.intervals.map(i => {
      return {
        title: t(`subscriptionFlow.${i.event.toLowerCase()}`),
        subscriptionFlowId: subscriptionFlow.id,
        object: i,
        icon: eventIcons[i.event.toUpperCase()],
        color: eventColors[i.event.toUpperCase()]
      }
    })
    return withTitle.find(
      i => i.object.event === eventName
    ) as DecoratedSubscriptionInterval<NonUserActionInterval>
  }

  return (
    <>
      {userActionEvents.map(event => (
        <TableCell key={event.subscriptionEventKey} align="center">
          {mailTemplates && (
            <MailTemplateSelect
              mailTemplates={mailTemplates}
              subscriptionInterval={userActionIntervalFor(
                subscriptionFlow,
                event.subscriptionEventKey
              )}
              subscriptionFlow={subscriptionFlow}
              event={event.subscriptionEventKey}
            />
          )}
        </TableCell>
      ))}
    </>
  )
}
