import {css, styled} from '@mui/material'

import {setCookie} from 'cookies-next'
import {NextPage, NextPageContext} from 'next'
import getConfig from 'next/config'
import {withAuthGuard} from '../../auth-guard'
import {ssrAuthLink} from '../../auth-link'
import {getSessionTokenProps} from '../../get-session-token-props'
import {ComponentProps} from 'react'
import {UserSession} from '@wepublish/website/api'
import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {ContentWrapper} from '@wepublish/content/website'
import {
  useHasUnpaidInvoices,
  InvoiceListContainer,
  SubscriptionListContainer
} from '@wepublish/membership/website'
import {PersonalDataFormContainer} from '@wepublish/user/website'
import {
  useSubscriptionsQuery,
  getV1ApiClient,
  LoginWithJwtDocument,
  MeDocument,
  NavigationListDocument,
  addClientCacheToV1Props
} from '@wepublish/website/api'
import {useWebsiteBuilder} from '@wepublish/website/builder'

const SubscriptionsWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  justify-content: center;
  grid-auto-columns: 1fr;

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-auto-flow: column;
      gap: ${theme.spacing(10)};
    }
  `}
`

const SubscriptionListWrapper = styled('div')`
  display: flex;
  flex-flow: column;
  gap: ${({theme}) => theme.spacing(2)};
`

const DeactivatedSubscriptions = styled('div')`
  display: grid;
  justify-content: center;
`

const ProfileWrapper = styled(ContentWrapper)`
  gap: ${({theme}) => theme.spacing(2)};
`

type ProfilePageProps = Omit<ComponentProps<typeof PersonalDataFormContainer>, ''>

function ProfilePage(props: ProfilePageProps) {
  const {
    elements: {Link, H4}
  } = useWebsiteBuilder()

  const {data: subscriptonData} = useSubscriptionsQuery({
    fetchPolicy: 'cache-only'
  })

  const hasDeactivatedSubscriptions = subscriptonData?.subscriptions.some(
    subscription => subscription.deactivation
  )

  const hasUnpaidInvoices = useHasUnpaidInvoices()

  return (
    <>
      <SubscriptionsWrapper>
        {hasUnpaidInvoices && (
          <SubscriptionListWrapper>
            <H4 component={'h1'}>Offene Rechnungen</H4>

            <InvoiceListContainer
              filter={invoices =>
                invoices.filter(
                  invoice => invoice.subscription && !invoice.canceledAt && !invoice.paidAt
                )
              }
            />
          </SubscriptionListWrapper>
        )}

        <SubscriptionListWrapper>
          <H4 component={'h1'}>Aktive Abos</H4>

          <SubscriptionListContainer
            filter={subscriptions =>
              subscriptions.filter(subscription => !subscription.deactivation)
            }
          />

          {hasDeactivatedSubscriptions && (
            <DeactivatedSubscriptions>
              <Link href="/profile/subscription/deactivated">Gekündete Abos anzeigen</Link>
            </DeactivatedSubscriptions>
          )}
        </SubscriptionListWrapper>
      </SubscriptionsWrapper>

      <ProfileWrapper>
        <H4 component={'h1'}>Profil</H4>

        <PersonalDataFormContainer {...props} />
      </ProfileWrapper>
    </>
  )
}

const GuardedProfile = withAuthGuard(ProfilePage) as NextPage<ComponentProps<typeof ProfilePage>>
GuardedProfile.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(() => getSessionTokenProps(ctx).sessionToken?.token)
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

  const sessionProps = getSessionTokenProps(ctx)

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({
        query: MeDocument
      }),
      client.query({
        query: NavigationListDocument
      })
    ])
  }

  const props = addClientCacheToV1Props(client, sessionProps)

  return props
}

export {GuardedProfile as ProfilePage}
