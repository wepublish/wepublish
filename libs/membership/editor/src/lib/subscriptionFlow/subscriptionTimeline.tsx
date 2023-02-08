import React from 'react'
import SubscriptionInterval from './subscriptionInterval'

export default function SubscriptionTimeline() {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          marginRight: '80px'
        }}>
        <div>
          <SubscriptionInterval />
        </div>
        <div>
          <SubscriptionInterval />
        </div>
        <div>
          <SubscriptionInterval />
        </div>
      </div>
    </>
  )
}
