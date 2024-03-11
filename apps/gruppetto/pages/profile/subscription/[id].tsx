import {css, styled} from '@mui/material'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {
  ApiV1,
  InvoiceListContainer,
  SubscriptionListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

const SubscriptionsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: 1fr 1fr;
      gap: ${theme.spacing(10)};
    }
  `}
`

const SubscriptionListWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({theme}) => theme.spacing(2)};
`

function Subscription() {
  const {
    query: {id}
  } = useRouter()
  const {
    elements: {H4}
  } = useWebsiteBuilder()

  const locationOrigin = typeof window !== 'undefined' ? location.origin : ''

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>Abo</H4>

        <SubscriptionListContainer
          successURL={`${locationOrigin}/payment/success`}
          failureURL={`${locationOrigin}/payment/fail`}
          filter={subscriptions => subscriptions.filter(subscription => subscription.id === id)}
        />
      </SubscriptionListWrapper>

      <SubscriptionListWrapper>
        <H4 component={'h1'}>Rechnungen</H4>

        <InvoiceListContainer
          successURL={`${locationOrigin}/payment/success`}
          failureURL={`${locationOrigin}/payment/fail`}
          filter={invoices => invoices.filter(invoice => invoice.subscriptionID === id)}
        />
      </SubscriptionListWrapper>
    </SubscriptionsWrapper>
  )
}

const GuardedSubscription = withAuthGuard(Subscription)

export {GuardedSubscription as default}
;(GuardedSubscription as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const sessionProps = await getSessionTokenProps(ctx)
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(sessionProps.sessionToken?.token)
  ])

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({
        query: ApiV1.MeDocument
      }),
      client.query({
        query: ApiV1.SubscriptionsDocument
      }),
      client.query({
        query: ApiV1.InvoicesDocument
      }),
      client.query({
        query: ApiV1.NavigationListDocument
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
