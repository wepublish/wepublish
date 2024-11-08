import {getSessionTokenProps, ssrAuthLink} from '@wepublish/utils/website'
import {ApiV1, AuthTokenStorageKey, SubscribeContainer} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

export default function Mitmachen() {
  const {
    query: {firstName, mail, lastName}
  } = useRouter()

  const locationOrigin = typeof window !== 'undefined' ? location.origin : ''
  const thisLocation = typeof window !== 'undefined' ? location.href : ''

  return (
    <SubscribeContainer
      defaults={{
        email: mail as string | undefined,
        firstName: firstName as string | undefined,
        name: lastName as string | undefined
      }}
      filter={memberPlans => memberPlans.filter(mb => mb.tags?.includes('crowdfunding'))}
      successURL={`${locationOrigin}/profile/subscription`}
      failureURL={thisLocation}
      fields={['firstName']}
      extraMoneyOffset={memberPlan => {
        if (memberPlan.slug === 'spende') {
          return 5000
        }

        if (memberPlan.slug === 'monatsabo') {
          return 100
        }

        if (memberPlan.slug === 'jahresabo') {
          return 250
        }

        if (memberPlan.slug === 'foerderabo') {
          return 3500
        }

        return 0
      }}
    />
  )
}

Mitmachen.getInitialProps = async (ctx: NextPageContext) => {
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

  const dataPromises = [
    client.query({
      query: ApiV1.MemberPlanListDocument,
      variables: {
        take: 50
      }
    }),
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ]

  if (sessionProps.sessionToken) {
    dataPromises.push(
      ...[
        client.query({
          query: ApiV1.MeDocument
        }),
        client.query({
          query: ApiV1.InvoicesDocument,
          variables: {
            take: 50
          }
        })
      ]
    )
  }

  await Promise.all(dataPromises)
  const props = ApiV1.addClientCacheToV1Props(client, sessionProps)

  return props
}
