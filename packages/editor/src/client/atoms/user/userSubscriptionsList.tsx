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
import EditIcon from '@rsuite/icons/legacy/Edit'
import {ButtonLink, SubscriptionEditRoute} from '../../route'

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
          <Reload style={{marginRight: '5px'}} />{' '}
          {t('userSubscriptionList.subscriptionIsAutoRenewed')}.&nbsp;
          {getDeactivationString(subscription)}
        </>
      )
    }
    // subscription is not auto renewed
    return (
      <>
        <Off style={{marginRight: '5px'}} /> {t('userSubscriptionList.noAutoRenew')}.
      </>
    )
  }

  function getDeactivationString(subscription: UserSubscriptionFragment) {
    const deactivation = subscription.deactivation
    if (deactivation) {
      return (
        <>
          {t('userSubscriptionList.deactivationString', {
            date: new Intl.DateTimeFormat('de-CH').format(new Date(deactivation.date)),
            reason: getDeactivationReasonHumanReadable(deactivation.reason)
          })}
        </>
      )
    }
    return t('userSubscriptionList.noDeactivation')
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
      return t('userSubscriptionList.paidUntil', {
        date: new Intl.DateTimeFormat('de-CH').format(new Date(subscription.paidUntil))
      })
    }
    return t('userSubscriptionList.invoiceUnpaid')
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

  function getInvoiceView(subscription: UserSubscriptionFragment, invoiceId: string) {
    const invoice = subscription.invoices.find(invoice => invoice.id === invoiceId)
    if (!invoice) {
      return t('userSubscriptionList.unexpectedErrorNoInvoice')
    }
    return (
      <div>
        {t('userSubscriptionList.invoiceNr', {invoiceId: invoice.id})} &nbsp;
        <b style={invoice.paidAt ? {color: 'green'} : {color: 'red'}}>
          {invoice.paidAt
            ? t('userSubscriptionList.invoicePaid')
            : t('userSubscriptionList.invoiceUnpaid')}
        </b>
      </div>
    )
  }

  return (
    <>
      {subscriptions?.map(subscription => (
        <div key={subscription.id}>
          <FlexboxGrid>
            {/* member plan name */}
            <FlexboxGrid.Item colspan={18} style={{alignSelf: 'center'}}>
              <h5>
                {t('userSubscriptionList.subscriptionTitle', {
                  memberPlanName: subscription.memberPlan.name,
                  subscriptionId: subscription.id
                })}
              </h5>
            </FlexboxGrid.Item>
            {/* edit subscription */}
            <FlexboxGrid.Item colspan={6} style={{textAlign: 'right'}}>
              <ButtonLink
                appearance="ghost"
                route={SubscriptionEditRoute.create({id: subscription.id})}>
                <EditIcon /> {t('userSubscriptionList.editSubscription')}
              </ButtonLink>
            </FlexboxGrid.Item>
            {/* subscription details */}
            <FlexboxGrid.Item colspan={12} style={{marginTop: '10px', paddingRight: '5px'}}>
              <FlexboxGrid>
                {/* subscription details title */}
                <FlexboxGrid.Item colspan={24} style={{marginLeft: '20px'}}>
                  <h6>{t('userSubscriptionList.aboDetails')}</h6>
                </FlexboxGrid.Item>
                <Panel bordered style={{marginTop: '5px'}}>
                  {/* created at */}
                  <FlexboxGrid.Item colspan={24}>
                    <Calendar style={{marginRight: '5px'}} />
                    {t('userSubscriptionList.subscriptionCreatedAt', {
                      date: new Intl.DateTimeFormat('de-CH').format(
                        new Date(subscription.createdAt)
                      )
                    })}
                  </FlexboxGrid.Item>
                  {/* starts at */}
                  <FlexboxGrid.Item colspan={24}>
                    <Creative style={{marginRight: '5px'}} />
                    {t('userSubscriptionList.subscriptionStartsAt', {
                      date: new Intl.DateTimeFormat('de-CH').format(new Date(subscription.startsAt))
                    })}
                  </FlexboxGrid.Item>
                  {/* payment periodicity */}
                  <FlexboxGrid.Item colspan={24}>
                    <PieChart style={{marginRight: '5px'}} />
                    {t('userSubscriptionList.paymentPeriodicity', {
                      paymentPeriodicity: paymentPeriodicity(subscription)
                    })}
                  </FlexboxGrid.Item>
                  {/* monthly amount */}
                  <FlexboxGrid.Item colspan={24}>
                    <CreditCardIcon style={{marginRight: '5px'}} />
                    {t('userSubscriptionList.monthlyAmount', {
                      monthlyAmount: (subscription.monthlyAmount / 100).toFixed(2)
                    })}
                  </FlexboxGrid.Item>
                  {/* paid until */}
                  <FlexboxGrid.Item colspan={24}>
                    <Exit style={{marginRight: '5px'}} /> {paidUntilView(subscription)}
                  </FlexboxGrid.Item>
                  {/* auto renewal */}
                  <FlexboxGrid.Item colspan={24}>{autoRenewalView(subscription)}</FlexboxGrid.Item>
                </Panel>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            {/* periods with invoices */}
            <FlexboxGrid.Item colspan={12} style={{marginTop: '10px', paddingLeft: '5px'}}>
              <FlexboxGrid>
                {/* periods title */}
                <FlexboxGrid.Item colspan={24} style={{marginLeft: '20px'}}>
                  <h6>{t('userSubscriptionList.periods')}</h6>
                </FlexboxGrid.Item>
                {/* iterate periods */}
                <FlexboxGrid.Item
                  colspan={24}
                  style={{maxHeight: '400px', overflowY: 'auto', marginTop: '5px'}}>
                  {subscription.periods.map(period => {
                    return (
                      <Panel key={period.id} bordered style={{marginBottom: '10px'}}>
                        <FlexboxGrid>
                          {/* period created at */}
                          <FlexboxGrid.Item colspan={24}>
                            {t('userSubscriptionList.periodCreatedAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(
                                new Date(period.createdAt)
                              )
                            })}
                          </FlexboxGrid.Item>
                          {/* period from to dates */}
                          <FlexboxGrid.Item colspan={24}>
                            {t('userSubscriptionList.periodStartsAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(
                                new Date(period.startsAt)
                              )
                            })}
                            <ArrowRightLine style={{margin: '0px 5px'}} />
                            {t('userSubscriptionList.periodEndsAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(new Date(period.endsAt))
                            })}
                          </FlexboxGrid.Item>
                          {/* amount */}
                          <FlexboxGrid.Item colspan={24}>
                            {t('userSubscriptionList.periodAmount', {
                              amount: (period.amount / 100).toFixed(2)
                            })}
                          </FlexboxGrid.Item>
                          {/* related invoice */}
                          <FlexboxGrid.Item colspan={24}>
                            {getInvoiceView(subscription, period.invoiceID)}
                          </FlexboxGrid.Item>
                        </FlexboxGrid>
                      </Panel>
                    )
                  })}
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
          <Divider />
        </div>
      ))}

      <div style={{marginTop: '20px'}}>{newSubscriptionButton({t})}</div>
    </>
  )
}
