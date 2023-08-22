import {ApiV1, SubscriptionListContainer} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {withAuthGuard} from '../../../src/auth-guard'
import {ssrAuthLink} from '../../../src/auth-link'
import {getSessionTokenProps} from '../../../src/get-session-token-props'
import {styled} from '@mui/material'

const SubscriptionsWrapper = styled('div')`
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

export {GuardedDeactivatedSubscriptions as default}
;(GuardedDeactivatedSubscriptions as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const sessionProps = await getSessionTokenProps(ctx)
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(sessionProps.sessionToken?.token)
  ])

  if (sessionProps.sessionToken) {
    await client.query({
      query: ApiV1.SubscriptionsDocument
    })
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
