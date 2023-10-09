import {ApiV1, SubscribeContainer} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {ssrAuthLink} from '../src/auth-link'
import {getSessionTokenProps} from '../src/get-session-token-props'

export default function Mitmachen() {
  const locationOrigin = typeof window !== 'undefined' ? location.origin : ''

  return (
    <SubscribeContainer
      successURL={`${locationOrigin}/payment/success`}
      failureURL={`${locationOrigin}/payment/fail`}
    />
  )
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
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
        query: ApiV1.MemberPlanListDocument,
        variables: {
          tage: 50
        }
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
