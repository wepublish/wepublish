import React, {useMemo} from 'react'
import SubscriptionInterval from './subscriptionInterval'
import {SubscriptionFlowFragment, SubscriptionIntervalFragment} from '@wepublish/editor/api-v2'

interface SubscriptionTimelineProps {
  subscriptionFlow: SubscriptionFlowFragment
}

export default function SubscriptionTimeline({subscriptionFlow}: SubscriptionTimelineProps) {
  // sorted subscription intervals
  const subscriptionIntervals: (SubscriptionIntervalFragment | undefined | null)[] = useMemo(() => {
    if (!subscriptionFlow) {
      return []
    }
    return [
      ...subscriptionFlow.additionalIntervals,
      subscriptionFlow['deactivationUnpaidMailTemplate'],
      subscriptionFlow['invoiceCreationMailTemplate']
    ].sort((a, b) => {
      if (!a || !b) return 0
      return a.daysAwayFromEnding - b.daysAwayFromEnding
    })
  }, [subscriptionFlow])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          marginRight: '80px'
        }}>
        {subscriptionIntervals.map(subscriptionInterval => (
          <>
            <div>
              <SubscriptionInterval subscriptionInterval={subscriptionInterval} />
            </div>
          </>
        ))}
      </div>
    </>
  )
}
