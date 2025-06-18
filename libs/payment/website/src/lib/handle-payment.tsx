import {
  FullMemberPlanFragment,
  Payment,
  usePageLazyQuery,
  usePayInvoiceMutation,
  useSubscribeMutation
} from '@wepublish/website/api'
import {useCallback, useState} from 'react'
import {RedirectPages} from './payment-form'

export const useSubscribe = (...params: Parameters<typeof useSubscribeMutation>) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const [redirectPages, setRedirectPages] = useState<RedirectPages>({
    successUrl: '',
    failUrl: ''
  })

  const [fetchPage] = usePageLazyQuery()
  const [result] = useSubscribeMutation({
    ...params[0]
  })

  const callback = useCallback(
    async (
      memberPlan: FullMemberPlanFragment | undefined | null,
      ...callbackParams: Parameters<typeof result>
    ) => {
      const [{data: successPage}, {data: failPage}] = await Promise.all([
        memberPlan?.successPageId
          ? fetchPage({
              variables: {
                id: memberPlan.successPageId
              }
            })
          : {data: undefined},
        memberPlan?.failPageId
          ? fetchPage({
              variables: {
                id: memberPlan.failPageId
              }
            })
          : {data: undefined}
      ])

      const successUrl = successPage?.page?.url ?? window.location.origin + '/profile'
      const failUrl = failPage?.page?.url ?? window.location.origin + '/profile'

      setRedirectPages({
        successUrl,
        failUrl
      })

      return result({
        ...callbackParams[0],
        variables: callbackParams[0]?.variables
          ? {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl
            }
          : undefined,
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data)
          handlePayment({
            intent: data.createSubscription ?? undefined,
            successUrl,
            failUrl,
            setStripeClientSecret
          })
        },
        onError: () => (window.location.href = failUrl)
      })
    },
    [fetchPage, result]
  )

  return [callback, redirectPages, stripeClientSecret] as const
}

export const usePayInvoice = (...params: Parameters<typeof usePayInvoiceMutation>) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>()
  const [redirectPages, setRedirectPages] = useState({
    successUrl: '',
    failUrl: ''
  })
  const [fetchPage] = usePageLazyQuery()

  const [result] = usePayInvoiceMutation({
    ...params[0]
  })

  const callback = useCallback(
    async (
      memberPlan: FullMemberPlanFragment | undefined | null,
      ...callbackParams: Parameters<typeof result>
    ) => {
      const [{data: successPage}, {data: failPage}] = await Promise.all([
        memberPlan?.successPageId
          ? fetchPage({
              variables: {
                id: memberPlan.successPageId
              }
            })
          : {data: undefined},
        memberPlan?.failPageId
          ? fetchPage({
              variables: {
                id: memberPlan.failPageId
              }
            })
          : {data: undefined}
      ])

      const successUrl = successPage?.page?.url ?? window.location.origin + '/profile'
      const failUrl = failPage?.page?.url ?? window.location.origin + '/profile'

      setRedirectPages({
        successUrl,
        failUrl
      })

      return result({
        ...callbackParams[0],
        variables: callbackParams[0]?.variables
          ? {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl
            }
          : undefined,
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data)
          handlePayment({
            intent: data.createPaymentFromInvoice ?? undefined,
            successUrl,
            failUrl,
            setStripeClientSecret
          })
        },
        onError: () => (window.location.href = failUrl)
      })
    },
    [fetchPage, result]
  )

  return [callback, redirectPages, stripeClientSecret] as const
}

const handlePayment = ({
  intent,
  successUrl,
  failUrl,
  setStripeClientSecret
}: {
  intent?: Payment
  successUrl: string
  failUrl: string
  setStripeClientSecret?: (secret: string | undefined) => void
}) => {
  if (!intent) {
    window.location.href = failUrl
    return
  }

  if (intent.state === 'paid') {
    window.location.href = successUrl
    return
  }

  if (intent.paymentMethod.paymentProviderID === 'stripe') {
    setStripeClientSecret?.(intent.intentSecret ?? undefined)
    return
  } else {
    setStripeClientSecret?.(undefined)
  }

  if (!intent.intentSecret) {
    window.location.href = successUrl
    return
  }

  if (intent.intentSecret?.startsWith('http')) {
    window.location.href = intent.intentSecret
    return
  }
}
