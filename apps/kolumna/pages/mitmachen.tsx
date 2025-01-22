import styled from '@emotion/styled'
import {getSessionTokenProps, ssrAuthLink} from '@wepublish/utils/website'
import {SubscribePage} from '@wepublish/utils/website'
import {ApiV1, AuthTokenStorageKey} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useMemo} from 'react'

import {CrowdfundingGoal} from '../src/crowdfunding/crowdfunding-goal'

const goals = [{goal: 700, until: new Date()}]

export const GoalsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

export const FinancedWrapper = styled('div')`
  font-size: ${({theme}) => theme.typography.h4.fontSize};
  text-align: center;
`

type MitmachenProps = {
  donate?: boolean
}

export default function Mitmachen({donate}: MitmachenProps) {
  const {data: newSubscribers} = ApiV1.useNewSubscribersQuery({
    variables: {
      start: '2024-01-11T00:00:00.000Z',
      end: '2025-01-11T00:00:00.000Z'
    }
  })

  const {data: memberplans} = ApiV1.useMemberPlanListQuery({
    variables: {
      take: 50
    }
  })

  const current = useMemo(
    () =>
      newSubscribers?.newSubscribers?.filter(
        ({memberPlan}) =>
          memberplans?.memberPlans.nodes.some(
            ({name, tags}) => name === memberPlan && tags?.includes('crowdfunding')
          ),
        0
      ).length ?? 0,
    [memberplans?.memberPlans.nodes, newSubscribers?.newSubscribers]
  )

  return (
    <>
      {!donate && (
        <GoalsWrapper>
          <FinancedWrapper>
            Bereits <strong>{current}</strong> machen mit!
          </FinancedWrapper>

          {goals.map((goal, index) => (
            <CrowdfundingGoal key={index} {...goal} current={current} />
          ))}
        </GoalsWrapper>
      )}

      <SubscribePage
        filter={memberPlans =>
          memberPlans.filter(mb =>
            donate ? mb.tags?.includes('spende') : mb.tags?.includes('crowdfunding')
          )
        }
        fields={['firstName']}
        termsOfServiceUrl="/agb"
        donate={() => !!donate}
      />
    </>
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
