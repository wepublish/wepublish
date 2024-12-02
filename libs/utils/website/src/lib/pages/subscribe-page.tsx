import {ApiV1, AuthTokenStorageKey, SubscribeContainer} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ComponentProps} from 'react'
import {ssrAuthLink} from '../auth-link'
import {getSessionTokenProps} from '../get-session-token-props'

type SubscribePageProps = Omit<ComponentProps<typeof SubscribeContainer>, ''>

export function SubscribePage(props: SubscribePageProps) {
  const {
    query: {
      memberPlanBySlug,
      additionalMemberPlans,
      firstName,
      mail,
      lastName,
      deactivateSubscriptionId
    }
  } = useRouter()

  return (
    <SubscribeContainer
      {...props}
      defaults={{
        email: mail as string | undefined,
        firstName: firstName as string | undefined,
        name: lastName as string | undefined,
        memberPlanSlug: memberPlanBySlug as string | undefined,
        ...props.defaults
      }}
      filter={memberPlans => {
        const parentFiltered = props.filter?.(memberPlans) ?? memberPlans

        const preselectedMemberPlan = parentFiltered.find(({slug}) => slug === memberPlanBySlug)

        if (additionalMemberPlans === 'upsell' && preselectedMemberPlan) {
          return parentFiltered.filter(
            memberPlan =>
              memberPlan.amountPerMonthMin >= preselectedMemberPlan.amountPerMonthMin ||
              memberPlan === preselectedMemberPlan
          )
        }

        return preselectedMemberPlan && additionalMemberPlans !== 'all'
          ? [preselectedMemberPlan]
          : parentFiltered
      }}
      deactivateSubscriptionId={
        props.deactivateSubscriptionId ?? (deactivateSubscriptionId as string | undefined)
      }
    />
  )
}

SubscribePage.getInitialProps = async (ctx: NextPageContext) => {
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
