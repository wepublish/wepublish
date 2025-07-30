import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {ssrAuthLink} from '../auth-link'
import {getSessionTokenProps} from '../get-session-token-props'
import {SessionWithTokenWithoutUser} from '@wepublish/website/api'
import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {SubscribeContainer} from '@wepublish/membership/website'
import {
  getV1ApiClient,
  LoginWithJwtDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  PeerProfileDocument,
  MeDocument,
  InvoicesDocument,
  addClientCacheToV1Props
} from '@wepublish/website/api'
import {ComponentProps} from 'react'

type SubscribePageProps = Omit<ComponentProps<typeof SubscribeContainer>, ''>

export function SubscribePage(props: SubscribePageProps) {
  const {
    query: {
      memberPlanBySlug,
      additionalMemberPlans,
      firstName,
      mail,
      lastName,
      deactivateSubscriptionId,
      userId
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
      returningUserId={userId as string | undefined}
    />
  )
}

SubscribePage.getInitialProps = async (ctx: NextPageContext) => {
  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(async () => (await getSessionTokenProps(ctx)).sessionToken?.token)
  ])

  if (ctx.query.jwt) {
    const data = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt
      }
    })

    setCookie(
      AuthTokenStorageKey,
      JSON.stringify(data.data.createSessionWithJWT as SessionWithTokenWithoutUser),
      {
        req: ctx.req,
        res: ctx.res,
        expires: new Date(data.data.createSessionWithJWT.expiresAt),
        sameSite: 'strict',
        httpOnly: true // @TODO: Config
      }
    )
  }

  const sessionProps = await getSessionTokenProps(ctx)

  const dataPromises = [
    client.query({
      query: MemberPlanListDocument,
      variables: {
        take: 50,
        filter: {
          active: true
        }
      }
    }),
    client.query({
      query: NavigationListDocument
    }),
    client.query({
      query: PeerProfileDocument
    })
  ]

  if (sessionProps.sessionToken) {
    dataPromises.push(
      ...[
        client.query({
          query: MeDocument
        }),
        client.query({
          query: InvoicesDocument,
          variables: {
            take: 50
          }
        })
      ]
    )
  }

  await Promise.all(dataPromises)
  const props = addClientCacheToV1Props(client, sessionProps)

  return props
}
