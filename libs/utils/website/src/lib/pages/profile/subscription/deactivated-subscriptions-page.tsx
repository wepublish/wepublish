import {styled} from '@mui/material'
import {withAuthGuard} from '../../../auth-guard'
import {ssrAuthLink} from '../../../auth-link'
import {getSessionTokenProps} from '../../../get-session-token-props'
import {
  ApiV1,
  AuthTokenStorageKey,
  ContentWrapper,
  SubscriptionListContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPage, NextPageContext} from 'next'
import getConfig from 'next/config'
import {ComponentProps} from 'react'

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`

function DeactivatedSubscriptions() {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  return (
    <SubscriptionsWrapper>
      <h1>Gekündigte Abos</h1>
      <SubscriptionListContainer
        filter={subscriptions => subscriptions.filter(subscription => subscription.deactivation)}
      />

      <Link href="/profile">Zurück zum Profil</Link>
    </SubscriptionsWrapper>
  )
}

const GuardedDeactivatedSubscriptions = withAuthGuard(DeactivatedSubscriptions) as NextPage<
  ComponentProps<typeof DeactivatedSubscriptions>
>
GuardedDeactivatedSubscriptions.getInitialProps = async (ctx: NextPageContext) => {
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
        query: ApiV1.NavigationListDocument
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, sessionProps)

  return props
}

export {GuardedDeactivatedSubscriptions as DeactivatedSubscriptionsPage}
