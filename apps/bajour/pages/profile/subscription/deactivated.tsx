import {styled} from '@mui/material'
import {ApiV1, SubscriptionListContainer} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

import {Container} from '../../../components/layout/container'
import {withAuthGuard} from '../../../components/should-be-website-builder/auth-guard'
import {ssrAuthLink} from '../../../components/should-be-website-builder/auth-link'
import {getSessionTokenProps} from '../../../components/should-be-website-builder/get-session-token-props'

const SubscriptionsWrapper = styled(Container)`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`

function DeactivatedSubscriptions() {
  return (
    <SubscriptionsWrapper>
      <SubscriptionListContainer
        failureURL="/"
        successURL="/"
        filter={subscriptions => subscriptions.filter(subscription => subscription.deactivation)}
      />
    </SubscriptionsWrapper>
  )
}

const GuardedDeactivatedSubscriptions = withAuthGuard(DeactivatedSubscriptions)

export {
  GuardedDeactivatedSubscriptions as default
  // eslint-disable-next-line
}
;(GuardedDeactivatedSubscriptions as any).getInitialProps = async (ctx: NextPageContext) => {
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
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
