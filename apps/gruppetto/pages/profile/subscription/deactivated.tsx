import {styled} from '@mui/material'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {ApiV1, SubscriptionListContainer} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

const SubscriptionsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: minmax(max-content, 500px);
  justify-content: center;
`

function DeactivatedSubscriptions() {
  const locationOrigin = typeof window !== 'undefined' ? location.origin : ''

  return (
    <SubscriptionsWrapper>
      <SubscriptionListContainer
        successURL={`${locationOrigin}/payment/success`}
        failureURL={`${locationOrigin}/payment/fail`}
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

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
