import {css, styled} from '@mui/material'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {
  ApiV1,
  AuthTokenStorageKey,
  InvoiceListContainer,
  SubscriptionListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

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

  const locationOrigin = typeof window !== 'undefined' ? location.origin : ''
  const thisLocation = typeof window !== 'undefined' ? location.href : ''

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>Aktive Abos</H4>

        <SubscriptionListContainer
          successURL={`${locationOrigin}/profile/subscription`}
          failureURL={thisLocation}
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
          successURL={`${locationOrigin}/profile/subscription`}
          failureURL={thisLocation}
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

export {GuardedSubscriptions as default}
;(GuardedSubscriptions as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(() => getSessionTokenProps(ctx).sessionToken?.token)
  ])

  if (ctx.query.jwt) {
    const data = await client.mutate({
      mutation: ApiV1.LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt
      }
    })

    setCookie(
      AuthTokenStorageKey,
      JSON.stringify(data.data.createSessionWithJWT as ApiV1.UserSession),
      {
        req: ctx.req,
        res: ctx.res,
        expires: new Date(data.data.createSessionWithJWT.expiresAt),
        sameSite: 'strict'
      }
    )
  }

  const sessionProps = getSessionTokenProps(ctx)

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

  const props = ApiV1.addClientCacheToV1Props(client, sessionProps)

  return props
}
