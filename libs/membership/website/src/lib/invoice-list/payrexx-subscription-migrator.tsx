import {FullInvoiceFragment, SubscribeMutation, useSubscribeMutation} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {useState} from 'react'
import {useRedirectPages} from '../subscribe/useSubscribe'
import {SubscribeResponseHandler} from '../subscribe/subscribe-response-handler'
import {FetchResult} from '@apollo/client'

interface PayrexxSubscriptionMigratorProps {
  invoice: FullInvoiceFragment
}

export function PayrexxSubscriptionMigrator({invoice}: PayrexxSubscriptionMigratorProps) {
  const {
    elements: {Button, Alert}
  } = useWebsiteBuilder()

  const [subscribe] = useSubscribeMutation({})
  const {fetchRedirectPages} = useRedirectPages()

  const [error, setError] = useState<string | undefined>()
  const [subscribeResponse, setSubscribeResponse] = useState<
    FetchResult<SubscribeMutation> | undefined
  >()

  async function migrateSubscription() {
    const subscription = invoice.subscription
    if (!subscription) {
      setError('Ein unerwarter Fehler ist aufgetreten. Die Subscription ist nicht verfügbar.')
      return
    }

    const {memberPlan} = subscription
    const memberPlanId = memberPlan.id

    const payrexxPaymentId = memberPlan.availablePaymentMethods.find(availablePaymentMethod => {
      return availablePaymentMethod.paymentMethods.find(paymentMethod => {
        return paymentMethod.slug === 'payrexx'
      })
    })?.paymentMethods?.[0]?.id

    if (!payrexxPaymentId) {
      setError('Der benötigte Payrexx-Payment-Adapter konnte nicht gefunden werden.')
      return
    }

    const [successPage, failPage] = await fetchRedirectPages({
      successPageId: memberPlan.successPageId,
      failPageId: memberPlan.failPageId
    })

    const response = await subscribe({
      variables: {
        deactivateSubscriptionId: subscription.id,
        autoRenew: subscription.autoRenew,
        monthlyAmount: subscription.monthlyAmount,
        memberPlanId,
        paymentPeriodicity: subscription.paymentPeriodicity,
        paymentMethodId: payrexxPaymentId,
        successURL: successPage.data?.page.url,
        failureURL: failPage.data?.page.url
      }
    })

    setSubscribeResponse(response)
  }

  return (
    <>
      {error && <Alert severity="warning">{error}</Alert>}
      <SubscribeResponseHandler
        subscribeResponse={subscribeResponse}
        memberPlan={invoice.subscription?.memberPlan}
      />
      <Button onClick={async () => await migrateSubscription()}>Jetzt bezahlen</Button>
    </>
  )
}
