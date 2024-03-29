import {getSessionTokenProps, ssrAuthLink} from '@wepublish/utils/website'
import {ApiV1, SubscribeContainer} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

export default function Mitmachen() {
  return <SubscribeContainer failureURL="/" successURL="/" />
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
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
        query: ApiV1.MemberPlanListDocument,
        variables: {
          tage: 50
        }
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
