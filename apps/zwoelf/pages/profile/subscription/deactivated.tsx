import {styled} from '@mui/material'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {
  ApiV1,
  AuthTokenStorageKey,
  ContentWrapper,
  SubscriptionListContainer
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`

function DeactivatedSubscriptions() {
  const locationOrigin = typeof window !== 'undefined' ? location.origin : ''
  const thisLocation = typeof window !== 'undefined' ? location.href : ''

  return (
    <SubscriptionsWrapper>
      <SubscriptionListContainer
        successURL={`${locationOrigin}/profile/subsription`}
        failureURL={thisLocation}
        filter={subscriptions => subscriptions.filter(subscription => subscription.deactivation)}
      />
    </SubscriptionsWrapper>
  )
}

const GuardedDeactivatedSubscriptions = withAuthGuard(DeactivatedSubscriptions)

export {GuardedDeactivatedSubscriptions as default}
;(GuardedDeactivatedSubscriptions as any).getInitialProps = async (ctx: NextPageContext) => {
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
