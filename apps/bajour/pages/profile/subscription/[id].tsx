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

import {Container} from '../../../src/components/layout/container'

const SubscriptionsWrapper = styled(Container)`
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

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>Abo</H4>

        <SubscriptionListContainer
          failureURL="/"
          successURL="/"
          filter={subscriptions => subscriptions.filter(subscription => subscription.id === id)}
        />
      </SubscriptionListWrapper>

      <SubscriptionListWrapper>
        <H4 component={'h1'}>Rechnungen</H4>

        <InvoiceListContainer
          failureURL="/"
          successURL="/"
          filter={invoices => invoices.filter(invoice => invoice.subscriptionID === id)}
        />
      </SubscriptionListWrapper>
    </SubscriptionsWrapper>
  )
}

const GuardedSubscription = withAuthGuard(Subscription)

export {
  GuardedSubscription as default
  // eslint-disable-next-line
}
;(GuardedSubscription as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const sessionProps = await getSessionTokenProps(ctx)
  const {publicRuntimeConfig} = getConfig()
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
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
