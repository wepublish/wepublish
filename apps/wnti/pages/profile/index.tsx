import {styled} from '@mui/material'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {
  ApiV1,
  AuthTokenStorageKey,
  PersonalDataFormContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {MdOutlinePayments} from 'react-icons/md'

const ProfileWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

const ProfileHeading = styled('div')`
  display: grid;
  grid-template-columns: auto auto;
`

const SubscriptionLink = styled('div')`
  text-align: right;
`

function Profile() {
  const {
    elements: {H4, Button, Link}
  } = useWebsiteBuilder()

  return (
    <ProfileWrapper>
      <ProfileHeading>
        <H4 component={'h1'}>Profil</H4>
        <SubscriptionLink>
          <Link href={'/profile/subscription'}>
            <Button size={'large'} startIcon={<MdOutlinePayments />}>
              Meine Abos
            </Button>
          </Link>
        </SubscriptionLink>
      </ProfileHeading>

      <PersonalDataFormContainer
        mediaEmail="info@wnti.ch"
        fields={['firstName', 'address', 'password', 'image']}
      />
    </ProfileWrapper>
  )
}

const GuardedProfile = withAuthGuard(Profile)

export {GuardedProfile as default}
;(GuardedProfile as any).getInitialProps = async (ctx: NextPageContext) => {
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
