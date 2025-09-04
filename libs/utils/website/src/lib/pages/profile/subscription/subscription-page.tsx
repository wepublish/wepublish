import styled from '@emotion/styled'

import {setCookie} from 'cookies-next'
import {NextPage, NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {withAuthGuard} from '../../../auth-guard'
import {ssrAuthLink} from '../../../auth-link'
import {getSessionTokenProps} from '../../../get-session-token-props'
import {ComponentProps} from 'react'
import {SubscriptionsQuery, UserSession} from '@wepublish/website/api'
import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {ContentWrapper} from '@wepublish/content/website'
import {SubscriptionListContainer, InvoiceListContainer} from '@wepublish/membership/website'
import {
  getV1ApiClient,
  LoginWithJwtDocument,
  MeDocument,
  SubscriptionsDocument,
  InvoicesDocument,
  addClientCacheToV1Props
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'

const SubscriptionsWrapper = styled(ContentWrapper)`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
    gap: ${({theme}) => theme.spacing(10)};

    & > * {
      grid-column: unset;
    }
  }
`

const SubscriptionListWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({theme}) => theme.spacing(2)};
`

function SubscriptionPage() {
  const {
    query: {id}
  } = useRouter()
  const {
    elements: {H4, Link}
  } = useWebsiteBuilder()

  return (
    <SubscriptionsWrapper>
      <SubscriptionListWrapper>
        <H4 component={'h1'}>Abo</H4>

        <SubscriptionListContainer
          filter={subscriptions => subscriptions.filter(subscription => subscription.id === id)}
        />
      </SubscriptionListWrapper>

      <SubscriptionListWrapper>
        <H4 component={'h1'}>Rechnungen</H4>

        <InvoiceListContainer
          filter={invoices => invoices.filter(invoice => invoice.subscriptionID === id)}
        />
      </SubscriptionListWrapper>

      <Link href="/profile">Zurück zum Profil</Link>
    </SubscriptionsWrapper>
  )
}

const GuardedSubscription = withAuthGuard(SubscriptionPage) as NextPage<
  ComponentProps<typeof SubscriptionPage>
>
GuardedSubscription.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

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

    setCookie(AuthTokenStorageKey, JSON.stringify(data.data.createSessionWithJWT as UserSession), {
      req: ctx.req,
      res: ctx.res,
      expires: new Date(data.data.createSessionWithJWT.expiresAt),
      sameSite: 'strict'
    })
  }

  const sessionProps = await getSessionTokenProps(ctx)

  if (sessionProps.sessionToken) {
    const [subscriptions] = await Promise.all([
      client.query<SubscriptionsQuery>({
        query: SubscriptionsDocument
      }),
      client.query({
        query: InvoicesDocument
      }),
      client.query({
        query: MeDocument
      })
    ])

    if (
      !subscriptions.error &&
      !subscriptions.data.subscriptions.find(subscription => subscription.id === ctx.query.id)
    ) {
      return {
        notFound: true
      }
    }
  }

  const props = addClientCacheToV1Props(client, sessionProps)

  return props
}

export {GuardedSubscription as SubscriptionPage}
