import React from 'react'
import {Divider, FlexboxGrid} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {newSubscriptionButton} from '../../routes/subscriptionList'
import {UserSubscriptionFragment} from '../../api'

interface UserSubscriptionsProps {
  subscriptions?: UserSubscriptionFragment[] | null
}

export function UserSubscriptionsList({subscriptions}: UserSubscriptionsProps) {
  const {t} = useTranslation()

  /**
   * UI helpers
   */

  return (
    <>
      {subscriptions?.map(subscription => (
        <FlexboxGrid key={subscription.id}>
          <FlexboxGrid.Item colspan={24}>
            <h5>{subscription.memberPlan.name}</h5>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>{subscription.deactivation}</FlexboxGrid.Item>
          <Divider />
        </FlexboxGrid>
      ))}

      <div style={{marginTop: '20px'}}>{newSubscriptionButton({t})}</div>
    </>
  )
}
