import React, {useMemo} from 'react'
import SubscriptionInterval from './subscriptionInterval'
import {SubscriptionFlowFragment} from '@wepublish/editor/api-v2'
import {SubscriptionNonUserAction} from './subscriptionFlows'
import {useTranslation} from 'react-i18next'

interface SubscriptionTimelineProps {
  subscriptionFlow: SubscriptionFlowFragment
}

export default function SubscriptionFlow({subscriptionFlow}: SubscriptionTimelineProps) {
  const {t} = useTranslation()

  // sorted subscription intervals
  const subscriptionNonUserActions: SubscriptionNonUserAction[] = useMemo(() => {
    if (!subscriptionFlow) {
      return []
    }
    return (
      [
        ...subscriptionFlow.additionalIntervals.map(subscriptionInterval => {
          return {
            title: t('subscriptionFlow.additionalIntervalTitle'),
            description: t('subscriptionFlow.additionalIntervalDescription'),
            subscriptionInterval
          }
        }),
        {
          subscriptionEventKey: 'invoiceCreationMailTemplate',
          subscriptionInterval: subscriptionFlow['invoiceCreationMailTemplate'],
          title: t('subscriptionFlow.invoiceCreationTitle'),
          description: t('subscriptionFlow.invoiceCreationDescription')
        },
        {
          subscriptionEventKey: 'deactivationUnpaidMailTemplate',
          subscriptionInterval: subscriptionFlow['deactivationUnpaidMailTemplate'],
          title: t('subscriptionFlow.deactivationUnpaidTitle'),
          description: t('subscriptionFlow.deactivationUnpaidDescription')
        }
      ] as SubscriptionNonUserAction[]
    ).sort((a, b) => {
      if (!a.subscriptionInterval || !b.subscriptionInterval) {
        return -1
      }
      return a.subscriptionInterval.daysAwayFromEnding - b.subscriptionInterval.daysAwayFromEnding
    })
  }, [subscriptionFlow])

  const timeLineInDays = useMemo(() => {
    return (
      Math.max(
        ...subscriptionNonUserActions.map(
          action => action.subscriptionInterval?.daysAwayFromEnding || 0
        )
      ) + 1
    )
  }, [subscriptionNonUserActions])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          marginRight: '80px'
        }}>
        {subscriptionNonUserActions.map(subscriptionNonUserAction => (
          <>
            <div>
              <SubscriptionInterval
                subscriptionNonUserAction={subscriptionNonUserAction}
                editMode={false}
              />
            </div>
          </>
        ))}
      </div>
    </>
  )
}
