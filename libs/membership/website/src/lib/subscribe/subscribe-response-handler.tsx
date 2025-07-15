import {StripeElement, StripePayment} from '@wepublish/payment/website'
import {FullMemberPlanFragment, usePageLazyQuery} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'

interface SubscribeResponseHandlerProps {
  errors: string[] | undefined
  stripeClientSecret: string | undefined
  memberPlan: FullMemberPlanFragment | undefined
}

export function SubscribeResponseHandler({
  errors,
  stripeClientSecret,
  memberPlan
}: SubscribeResponseHandlerProps) {
  const {
    elements: {Alert}
  } = useWebsiteBuilder()

  const [fetchPage] = usePageLazyQuery()

  // @todo > try-catch-block for fetching > check it with original version > comment from itrulia
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
      {errors && errors.map(error => <Alert severity="error">{error}</Alert>)}
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
