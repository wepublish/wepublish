import {FetchResult} from '@apollo/client'
import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {FullMemberPlanFragment, SubscribeMutation, usePageLazyQuery} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {useCallback, useEffect, useState} from 'react'

interface SubscribeResponseHandlerProps {
  subscribeResponse: FetchResult<SubscribeMutation> | undefined
  memberPlan: FullMemberPlanFragment | undefined
  onError?: () => void
}

/**
 * You can use this component after you called a subscribe mutation.
 * It will handle the necessary payment form, re-directs and error-handling.
 * For an implementation example see subscribe-container.tsx
 * You may want to re-load data via onError prop callback function
 */
export function SubscribeResponseHandler({
  subscribeResponse,
  memberPlan,
  onError
}: SubscribeResponseHandlerProps) {
  const {
    elements: {Alert}
  } = useWebsiteBuilder()

  const [fetchPage] = usePageLazyQuery()

  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const [errors, setErrors] = useState<string[] | undefined>()

  const handleError = useCallback(
    (errors: string[]) => {
      setErrors(errors)
      onError?.()
    },
    [onError]
  )

  const handleSubscribeResponse = useCallback(async () => {
    if (!subscribeResponse) {
      return
    }

    const successPage = await fetchPage({
      variables: {
        id: memberPlan?.successPageId
      }
    })
    const successUrl = successPage.data?.page.url || '/profile'

    if (subscribeResponse.errors) {
      handleError(subscribeResponse.errors.map(error => error.message))
      return
    }

    if (!subscribeResponse.data) {
      handleError(['Unerwarteter Fehler: Die Serverantwort war ohne Daten.'])
      return
    }

    const {createSubscription} = subscribeResponse.data

    // subscription was paid with existing credit card.
    // in this case intentSecret can be undefined. So this check must run before checking if intentSecret is empty!
    if (createSubscription.state === 'paid') {
      window.location.href = successUrl
      return
    }

    if (!createSubscription.intentSecret) {
      handleError(['Unerwarteter Fehler: Die Serverantwort lieferte keinen intent secret zurück.'])
      return
    }

    // payrexx
    if (createSubscription.intentSecret.startsWith('http')) {
      window.location.href = createSubscription.intentSecret as string
      return
    } else if (createSubscription.intentSecret.startsWith('no_charge')) {
      // trial subscriptions: non-charge-payment-adapter
      window.location.href = successUrl
      return
    } else if (createSubscription.paymentMethod.paymentProviderID === 'stripe') {
      setStripeClientSecret(createSubscription.intentSecret)
      return
    }

    // handle fallback
    handleError(['Unbekannter Fehler!'])
  }, [subscribeResponse, handleError, memberPlan, fetchPage])

  // entry point. whenever a subscribe response is passed, this component handles it.
  useEffect(() => {
    handleSubscribeResponse()
  }, [subscribeResponse, handleSubscribeResponse])

  async function onCloseStripeElement(success: boolean) {
    if (!memberPlan) {
      window.location.href = '/profile'
      return
    }

    const page = await fetchPage({
      variables: {
        id: success ? memberPlan.successPageId : memberPlan.failPageId
      }
    })

    window.location.href = page.data?.page.url ?? '/profile'
  }

  return (
    <>
      {errors && errors.map(error => <Alert security="warning">{error}</Alert>)}
      {stripeClientSecret && (
        <StripeElement clientSecret={stripeClientSecret}>
          <StripePayment
            onClose={async success => {
              await onCloseStripeElement(success)
            }}
          />
        </StripeElement>
      )}
    </>
  )
}
