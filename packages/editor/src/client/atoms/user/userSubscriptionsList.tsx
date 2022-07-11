import React from 'react'
import {Divider, FlexboxGrid, Panel} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {newSubscriptionButton} from '../../routes/subscriptionList'
import {
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  UserSubscriptionFragment
} from '../../api'
import {ArrowRightLine, Calendar, Creative, Exit, Off, PieChart, Reload} from '@rsuite/icons'
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
          <Reload style={{marginRight: '5px'}} /> Subscription wird automatisch erneuert.{' '}
          {getDeactivationString(subscription)}
        </>
      )
    }
    // subscription is not auto renewed
    return (
      <>
        <Off style={{marginRight: '5px'}} /> Subscription läuft aus, keine Auto-Erneuerung.
      </>
    )
  }

  function getDeactivationString(subscription: UserSubscriptionFragment) {
    const deactivation = subscription.deactivation
    if (deactivation) {
      return (
        <>
          Gekündet am {new Intl.DateTimeFormat('de-CH').format(new Date(deactivation.date))}. Grund:{' '}
          {getDeactivationReasonHumanReadable(deactivation.reason)}
        </>
      )
    }
    return <>Keine Deaktivierung.</>
  }

  function getDeactivationReasonHumanReadable(deactivationReason: SubscriptionDeactivationReason) {
    switch (deactivationReason) {
      case SubscriptionDeactivationReason.None:
        return t('userSubscriptionList.deactivationReason.None')
      case SubscriptionDeactivationReason.InvoiceNotPaid:
        return t('userSubscriptionList.deactivationReason.InvoiceNotPaid')
      case SubscriptionDeactivationReason.UserSelfDeactivated:
        return t('userSubscriptionList.deactivationReason.UserSelfDeactivated')
    }
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
        <div key={subscription.id}>
          <FlexboxGrid>
            {/* member plan name */}
            <FlexboxGrid.Item colspan={24}>
              <h5>
                {subscription.memberPlan.name} - #{subscription.id}
              </h5>
            </FlexboxGrid.Item>
            {/* subscription details */}
            <FlexboxGrid.Item colspan={12} style={{marginTop: '10px'}}>
              <FlexboxGrid>
                {/* subscription details title */}
                <FlexboxGrid.Item colspan={24}>
                  <h6>Abo-Details</h6>
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
                {/* deactivation */}
                <FlexboxGrid.Item colspan={24}>...</FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            {/* periods with invoices */}
            <FlexboxGrid.Item colspan={12} style={{marginTop: '10px'}}>
              <FlexboxGrid>
                {/* periods title */}
                <FlexboxGrid.Item colspan={24}>
                  <h6>Perioden</h6>
                </FlexboxGrid.Item>
                {/* iterate periods*/}
                <FlexboxGrid.Item colspan={24}>
                  {subscription.periods.map(period => {
                    return (
                      <Panel bordered style={{marginBottom: '10px'}}>
                        <FlexboxGrid>
                          {/* period created at */}
                          <FlexboxGrid.Item colspan={24}>
                            Erstellt am{' '}
                            {new Intl.DateTimeFormat('de-CH').format(new Date(period.createdAt))}
                          </FlexboxGrid.Item>
                          {/* period from to dates */}
                          <FlexboxGrid.Item colspan={24}>
                            Gültig von{' '}
                            {new Intl.DateTimeFormat('de-CH').format(new Date(period.startsAt))}
                            <ArrowRightLine style={{margin: '0px 5px'}} />
                            bis {new Intl.DateTimeFormat('de-CH').format(new Date(period.endsAt))}
                          </FlexboxGrid.Item>
                          {/* amount */}
                          <FlexboxGrid.Item colspan={24}>
                            Betrag: {(period.amount / 100).toFixed(2)} CHF
                          </FlexboxGrid.Item>
                        </FlexboxGrid>
                      </Panel>
                    )
                  })}
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
          <FlexboxGrid.Item colspan={24}>
            Todo: periods, invoices, subscription anschauen-button, invoice-ansicht, translations,
            margins/paddings - [ ] UserEditPanel löschen => Tests anpassen - [ ] user.ts -- line 61
            & 66 -- wie kann man resolvers mit context passen, damit man die daten so laden kann? --
            performance... Speichern & Schliessen
          </FlexboxGrid.Item>
          <Divider />
        </div>
      ))}

      <div style={{marginTop: '20px'}}>{newSubscriptionButton({t})}</div>
    </>
  )
}
