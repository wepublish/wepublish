import {styled} from '@mui/material'
import {ApiV1, PersonalDataFormContainer, useWebsiteBuilder} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

import {Container} from '../../components/layout/container'
import {withAuthGuard} from '../../components/should-be-website-builder/auth-guard'
import {ssrAuthLink} from '../../components/should-be-website-builder/auth-link'
import {getSessionTokenProps} from '../../components/should-be-website-builder/get-session-token-props'

const ProfileWrapper = styled(Container)`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

function Profile() {
  const {
    elements: {H4}
  } = useWebsiteBuilder()

  return (
    <ProfileWrapper>
      <H4 component={'h1'}>Profil</H4>

      <PersonalDataFormContainer mediaEmail="info@wepublish.dev" />
    </ProfileWrapper>
  )
}

const GuardedProfile = withAuthGuard(Profile)

export {
  GuardedProfile as default
  // eslint-disable-next-line
}
;(GuardedProfile as any).getInitialProps = async (ctx: NextPageContext) => {
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
      })
    ])
  }

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
