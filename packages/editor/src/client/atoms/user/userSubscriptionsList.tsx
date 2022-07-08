import React from 'react'
import {Divider, FlexboxGrid} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {newSubscriptionButton} from '../../routes/subscriptionList'
import {PaymentPeriodicity, UserSubscriptionFragment} from '../../api'
import {Calendar, Creative, Exit, Off, PieChart, Reload} from '@rsuite/icons'
import CreditCardIcon from '@rsuite/icons/legacy/CreditCard'

interface UserSubscriptionsProps {
  subscriptions?: UserSubscriptionFragment[] | null
}

export function UserSubscriptionsList({subscriptions}: UserSubscriptionsProps) {
  const {t} = useTranslation()

  /**
   * UI helpers
   */
  function autoRenewalView(subscription: UserSubscriptionFragment) {
    if (subscription.autoRenew) {
      return (
        <>
          <Reload style={{marginRight: '5px'}} /> Subscription wird automatisch erneuert
        </>
      )
    }
    return (
      <>
        <Off style={{marginRight: '5px'}} /> Subscription läuft aus
      </>
    )
  }

  function paidUntilView(subscription: UserSubscriptionFragment) {
    if (subscription.paidUntil) {
      return (
        <>
          Bezahlt bis am {new Intl.DateTimeFormat('de-CH').format(new Date(subscription.paidUntil))}
        </>
      )
    }
    return <>Nicht bezahlt</>
  }

  function paymentPeriodicity(subscription: UserSubscriptionFragment) {
    switch (subscription.paymentPeriodicity) {
      case PaymentPeriodicity.Monthly:
        return t('memberPlanList.paymentPeriodicity.MONTHLY')
      case PaymentPeriodicity.Quarterly:
        return t('memberPlanList.paymentPeriodicity.QUARTERLY')
      case PaymentPeriodicity.Biannual:
        return t('memberPlanList.paymentPeriodicity.BIANNUAL')
      case PaymentPeriodicity.Yearly:
        return t('memberPlanList.paymentPeriodicity.YEARLY')
      default:
        return 'Unknown Error'
    }
  }

  return (
    <>
      {subscriptions?.map(subscription => (
        <>
          <FlexboxGrid key={subscription.id}>
            {/* member plan name */}
            <FlexboxGrid.Item colspan={24}>
              <h5>
                {subscription.memberPlan.name} - #{subscription.id}
              </h5>
            </FlexboxGrid.Item>
            {/* created at */}
            <FlexboxGrid.Item colspan={24}>
              <Calendar style={{marginRight: '5px'}} /> Erstellt{' '}
              {new Intl.DateTimeFormat('de-CH').format(new Date(subscription.createdAt))}
            </FlexboxGrid.Item>
            {/* starts at */}
            <FlexboxGrid.Item colspan={24}>
              <Creative style={{marginRight: '5px'}} /> Abo startet am{' '}
              {new Intl.DateTimeFormat('de-CH').format(new Date(subscription.startsAt))}
            </FlexboxGrid.Item>
            {/* payment periodicity */}
            <FlexboxGrid.Item colspan={24}>
              <PieChart style={{marginRight: '5px'}} /> Zahlungsperiodizität:{' '}
              {paymentPeriodicity(subscription)}
            </FlexboxGrid.Item>
            {/* monthly amount */}
            <FlexboxGrid.Item colspan={24}>
              <CreditCardIcon style={{marginRight: '5px'}} /> Monatlicher Betrag:{' '}
              {(subscription.monthlyAmount / 100).toFixed(2)} CHF
            </FlexboxGrid.Item>
            {/* paid until */}
            <FlexboxGrid.Item colspan={24}>
              <Exit style={{marginRight: '5px'}} /> {paidUntilView(subscription)}
            </FlexboxGrid.Item>
            {/* auto renewal */}
            <FlexboxGrid.Item colspan={24}>{autoRenewalView(subscription)}</FlexboxGrid.Item>
          </FlexboxGrid>
          <FlexboxGrid.Item colspan={24}>
            Todo: periods, deactivation, invoices, translations, margins/paddings - [ ]
            UserEditPanel löschen => Tests anpassen - [ ] user.ts => line 61 & 66 => wie kann man
            resolvers mit context passen, damit man die daten so laden kann? => performance...
          </FlexboxGrid.Item>
          <Divider />
        </>
      ))}

      <div style={{marginTop: '20px'}}>{newSubscriptionButton({t})}</div>
    </>
  )
}
