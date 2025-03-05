import {css, styled} from '@mui/material'
import {
  ApiV1,
  AuthTokenStorageKey,
  ContentWrapper,
  InvoiceListContainer,
  InvoiceListItemContent,
  PersonalDataFormContainer,
  SubscriptionListContainer,
  useHasUnpaidInvoices,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPage, NextPageContext} from 'next'
import getConfig from 'next/config'
import {withAuthGuard} from '../../auth-guard'
import {ssrAuthLink} from '../../auth-link'
import {getSessionTokenProps} from '../../get-session-token-props'
import {ComponentProps} from 'react'

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

const UnpaidInvoiceListContainer = styled(InvoiceListContainer)`
  ${InvoiceListItemContent} {
    border: 8px solid ${({theme}) => theme.palette.primary.main};
    border-radius: ${({theme}) => theme.shape.borderRadius}px;
  }
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

  const {data: subscriptonData} = ApiV1.useSubscriptionsQuery({
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

            <UnpaidInvoiceListContainer
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

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({
        query: ApiV1.MeDocument
      }),
      client.query({
        query: ApiV1.NavigationListDocument
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, sessionProps)

  return props
}

export {GuardedProfile as ProfilePage}
