import {FullMemberPlanFragment, SubscribeMutation, usePageLazyQuery} from '@wepublish/website/api'

export function useSubscribe() {
  const [fetchPage] = usePageLazyQuery()

  const profilePage = () => `${window.location.origin}/profile`

  async function fetchRedirectPageUrls({
    successPageId,
    failPageId,
    confirmationPageId
  }: {
    successPageId?: string | null | undefined
    failPageId?: string | null | undefined
    confirmationPageId?: string | null | undefined
  }) {
    const [successPage, failPage, confirmationPage] = await Promise.all([
      successPageId
        ? fetchPage({variables: {id: successPageId}})
        : Promise.resolve({data: undefined}),
      failPageId ? fetchPage({variables: {id: failPageId}}) : Promise.resolve({data: undefined}),
      confirmationPageId
        ? fetchPage({variables: {id: confirmationPageId}})
        : Promise.resolve({data: undefined})
    ])

    return {
      successURL: successPage.data?.page.url || profilePage(),
      failureURL: failPage.data?.page.url || profilePage(),
      confirmationURL: confirmationPage.data?.page.url || profilePage()
    }
  }

  async function handleSubscribeResponse({
    subscribeResponse,
    memberPlan,
    onStripeIntent,
    onError
  }: {
    subscribeResponse: SubscribeMutation | undefined
    memberPlan: FullMemberPlanFragment | undefined
    onStripeIntent: (intentSecret: string) => void
    onError: (errors: string[]) => void
  }) {
    if (!subscribeResponse) {
      onError(['Unerwarter Fehler: Die Serverantwort lieferte eine leere Antwort.'])
      return
    }

    const successPage = await fetchPage({
      variables: {
        id: memberPlan?.successPageId
      }
    })
    const successUrl = successPage.data?.page.url || profilePage()

    const {createSubscription} = subscribeResponse

    // subscription was paid with existing credit card.
    // in this case intentSecret can be undefined. So this check must run before checking if intentSecret is empty!
    if (createSubscription.state === 'paid') {
      window.location.href = successUrl
      return
    }

    if (!createSubscription.intentSecret) {
      onError(['Unerwarteter Fehler: Die Serverantwort lieferte keinen intentSecret zurück.'])
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
      onStripeIntent(createSubscription.intentSecret)
      return
    }

    // handle fallback
    onError(['Unbekannter Fehler!'])
  }

  return {
    handleSubscribeResponse,
    fetchRedirectPageUrls
  }
}
