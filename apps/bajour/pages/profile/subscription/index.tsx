import {css, styled} from '@mui/material'
import {
  ApiV1,
  InvoiceListContainer,
  SubscriptionListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {NextPageContext} from 'next'
import {withAuthGuard} from '../../../components/should-be-website-builder/auth-guard'
import {ssrAuthLink} from '../../../components/should-be-website-builder/auth-link'
import {getSessionTokenProps} from '../../../components/should-be-website-builder/get-session-token-props'
import {Container} from '../../../components/layout/container'
import getConfig from 'next/config'

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

const DeactivatedSubscriptions = styled('div')`
  display: grid;
  justify-content: center;
`

function Subscriptions() {
  const {
    elements: {Link, H4}
  } = useWebsiteBuilder()

  const {data} = ApiV1.useSubscriptionsQuery({
    fetchPolicy: 'cache-only'
  })

  const hasDeactivatedSubscriptions = data?.subscriptions.some(
    subscription => subscription.deactivation
  )

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>Aktive Abos</H4>

        <SubscriptionListContainer
          failureURL="/"
          successURL="/"
          filter={subscriptions => subscriptions.filter(subscription => !subscription.deactivation)}
        />

        {hasDeactivatedSubscriptions && (
          <DeactivatedSubscriptions>
            <Link href="/profile/subscription/deactivated">Gekündete Abos anzeigen</Link>
          </DeactivatedSubscriptions>
        )}
      </SubscriptionListWrapper>

      <SubscriptionListWrapper>
        <H4 component={'h1'}>Offene Rechnungen</H4>

        <InvoiceListContainer
          failureURL="/"
          successURL="/"
          filter={invoices =>
            invoices.filter(
              invoice => invoice.subscription && !invoice.canceledAt && !invoice.paidAt
            )
          }
        />
      </SubscriptionListWrapper>
    </SubscriptionsWrapper>
  )
}

const GuardedSubscriptions = withAuthGuard(Subscriptions)

export {
  GuardedSubscriptions as default
  // eslint-disable-next-line
}
;(GuardedSubscriptions as any).getInitialProps = async (ctx: NextPageContext) => {
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
