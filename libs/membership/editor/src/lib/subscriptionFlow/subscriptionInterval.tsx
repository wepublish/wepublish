import React from 'react'
import {SubscriptionNonUserAction} from './subscriptionFlows'

interface SubscriptionIntervalProps {
  subscriptionNonUserAction: SubscriptionNonUserAction
}
export default function SubscriptionInterval({
  subscriptionNonUserAction
}: SubscriptionIntervalProps) {
  const {subscriptionInterval, title, description, subscriptionEventKey} = subscriptionNonUserAction

  return (
    <>
      <div
        style={{
          marginTop: '5px',
          border: '1px solid black',
          borderRadius: '5px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}>
        {title}
      </div>
    </>
  )
}
