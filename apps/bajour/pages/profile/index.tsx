import styled from '@emotion/styled'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {
  ApiV1,
  AuthTokenStorageKey,
  ContentWrapper,
  PersonalDataFormContainer,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

import {Container} from '../../src/components/layout/container'

const ProfileWrapper = styled(ContentWrapper)`
  gap: ${({theme}) => theme.spacing(2)};
`

function Profile() {
  const {
    elements: {H4}
  } = useWebsiteBuilder()

  return (
    <Container>
      <ProfileWrapper>
        <H4 component={'h1'}>Profil</H4>
        <PersonalDataFormContainer mediaEmail="info@bajour.ch" />
      </ProfileWrapper>
    </Container>
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
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, sessionProps)

  return props
}
