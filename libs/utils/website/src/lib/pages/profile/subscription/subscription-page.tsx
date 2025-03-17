import {styled} from '@mui/material'
import {
  ApiV1,
  AuthTokenStorageKey,
  ContentWrapper,
  InvoiceListContainer,
  SubscriptionListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPage, NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {withAuthGuard} from '../../../auth-guard'
import {ssrAuthLink} from '../../../auth-link'
import {getSessionTokenProps} from '../../../get-session-token-props'
import {ComponentProps} from 'react'

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
    gap: ${({theme}) => theme.spacing(10)};

    & > * {
      grid-column: unset;
    }
  }
`

const SubscriptionListWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({theme}) => theme.spacing(2)};
`

function SubscriptionPage() {
  const {
    query: {id}
  } = useRouter()
  const {
    elements: {H4, Link}
  } = useWebsiteBuilder()

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>Abo</H4>

        <SubscriptionListContainer
          filter={subscriptions => subscriptions.filter(subscription => subscription.id === id)}
        />
      </SubscriptionListWrapper>

      <SubscriptionListWrapper>
        <H4 component={'h1'}>Rechnungen</H4>

        <InvoiceListContainer
          filter={invoices => invoices.filter(invoice => invoice.subscriptionID === id)}
        />
      </SubscriptionListWrapper>

      <Link href="/profile">Zurück zum Profil</Link>
    </SubscriptionsWrapper>
  )
}

const GuardedSubscription = withAuthGuard(SubscriptionPage) as NextPage<
  ComponentProps<typeof SubscriptionPage>
>
GuardedSubscription.getInitialProps = async (ctx: NextPageContext) => {
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
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, sessionProps)

  return props
}

export {GuardedSubscription as SubscriptionPage}
