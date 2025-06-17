import {FullInvoiceFragment, useSubscribeMutation} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {useContext, useState} from 'react'
import {SubscribeResponseHandler} from '../subscribe/subscribe-response-handler'
import {useSubscribe} from '../subscribe/useSubscribe'
import {InvoiceListConext} from './invoice-list-container'
import {MdRefresh} from 'react-icons/md'

interface PayrexxSubscriptionMigratorProps {
  invoice: FullInvoiceFragment
}

export function PayrexxSubscriptionMigrator({invoice}: PayrexxSubscriptionMigratorProps) {
  const {
    elements: {Button}
  } = useWebsiteBuilder()
  const {fetchRedirectPageUrls, handleSubscribeResponse} = useSubscribe()

  const {refetch: refetchInvoiceList} = useContext(InvoiceListConext)

  const [errors, setErrors] = useState<string[] | undefined>()
  const [stripeIntent, setStripeIntent] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const subscription = invoice.subscription
  const memberPlan = subscription?.memberPlan

  function handleError(errorMessage: string) {
    setErrors([errorMessage])
    refetchInvoiceList?.()
    setLoading(false)
  }

  const [subscribe] = useSubscribeMutation({
    onError: error => handleError(error.message),
    onCompleted: subscribeResponse => {
      handleSubscribeResponse({
        subscribeResponse,
        memberPlan,
        onError: errors => setErrors(errors),
        onStripeIntent: stripeIntent => setStripeIntent(stripeIntent)
      })
    }
  })

  async function migrateSubscription() {
    try {
      setLoading(true)
      if (!subscription) {
        throw new Error('Unerwarter Fehler: Die Subscription ist nicht verfügbar.')
      }

      if (!memberPlan) {
        throw new Error('Unerwarteter Fehler: MemberPlan ist nicht verfügbar.')
      }

      const memberPlanId = memberPlan.id

      const payrexxPaymentId = memberPlan.availablePaymentMethods
        .find(availablePaymentMethod => {
          return availablePaymentMethod.paymentMethods.find(paymentMethod => {
            return paymentMethod.slug === 'payrexx'
          })
        })
        ?.paymentMethods?.find(paymentMethod => paymentMethod.slug === 'payrexx')?.id

      if (!payrexxPaymentId) {
        throw new Error('Der benötigte Payrexx-Payment-Adapter konnte nicht gefunden werden.')
      }

      const {successURL, failureURL} = await fetchRedirectPageUrls({
        successPageId: memberPlan.successPageId,
        failPageId: memberPlan.failPageId
      })

      await subscribe({
        variables: {
          deactivateSubscriptionId: subscription.id,
          autoRenew: subscription.autoRenew,
          monthlyAmount: subscription.monthlyAmount,
          memberPlanId,
          paymentPeriodicity: subscription.paymentPeriodicity,
          paymentMethodId: payrexxPaymentId,
          successURL,
          failureURL
        }
      })
    } catch (error) {
      handleError(error as string)
    }
  }

  return (
    <>
      <SubscribeResponseHandler
        errors={errors}
        memberPlan={memberPlan}
        stripeClientSecret={stripeIntent}
      />
      {errors?.length ? (
        <Button
          onClick={async () => {
            setLoading(true)
            await refetchInvoiceList?.()
          }}
          disabled={loading}
          startIcon={<MdRefresh />}>
          Neu laden
        </Button>
      ) : (
        <Button onClick={async () => await migrateSubscription()} disabled={loading}>
          Jetzt bezahlen
        </Button>
      )}
    </>
  )
}
