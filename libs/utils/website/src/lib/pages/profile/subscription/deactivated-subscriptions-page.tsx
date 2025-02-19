import {styled} from '@mui/material'
import {withAuthGuard} from '../../../auth-guard'
import {ssrAuthLink} from '../../../auth-link'
import {getSessionTokenProps} from '../../../get-session-token-props'

import {setCookie} from 'cookies-next'
import {NextPage, NextPageContext} from 'next'
import getConfig from 'next/config'
import {ComponentProps} from 'react'
import {SubscriptionListContainer} from '@wepublish/membership/website'
import {ContentWrapper} from '@wepublish/content/website'

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`

function DeactivatedSubscriptions() {
  return (
    <SubscriptionsWrapper>
      <SubscriptionListContainer
        filter={subscriptions => subscriptions.filter(subscription => subscription.deactivation)}
      />
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
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(() => getSessionTokenProps(ctx).sessionToken?.token)
  ])

  if (ctx.query.jwt) {
    const data = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt
      }
    })

    setCookie(AuthTokenStorageKey, JSON.stringify(data.data.createSessionWithJWT as UserSession), {
      req: ctx.req,
      res: ctx.res,
      expires: new Date(data.data.createSessionWithJWT.expiresAt),
      sameSite: 'strict'
    })
  }

  const sessionProps = getSessionTokenProps(ctx)

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({
        query: MeDocument
      }),
      client.query({
        query: SubscriptionsDocument
      }),
      client.query({
        query: NavigationListDocument
      })
    ])
  }

  const props = addClientCacheToV1Props(client, sessionProps)

  return props
}

export {GuardedDeactivatedSubscriptions as DeactivatedSubscriptionsPage}
