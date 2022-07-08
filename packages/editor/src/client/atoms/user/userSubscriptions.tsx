import React from 'react'
import {Col, Grid, Row} from 'rsuite'
import {FullSubscriptionFragment} from '../../api'
import {useTranslation} from 'react-i18next'
import {newSubscriptionButton} from '../../routes/subscriptionList'

interface UserSubscriptionsProps {
  subscriptions?: FullSubscriptionFragment[]
}

export function UserSubscriptions({subscriptions}: UserSubscriptionsProps) {
  const {t} = useTranslation()

  /**
   * UI helpers
   */
  function subscriptionListView() {
    return (
      <>
        <Grid>
          {/* iterate subscriptions */}
          <Row>
            <Col>iteriere subscriptions</Col>
          </Row>
        </Grid>
      </>
    )
  }

  function subscriptionsView() {
    if (!subscriptions?.length) {
      return newSubscriptionButton({t})
    }
    return subscriptionListView()
  }

  return <>{subscriptionsView()}</>
}
