import {styled} from '@mui/material'
import {getSessionTokenProps, ssrAuthLink, withAuthGuard} from '@wepublish/utils/website'
import {ApiV1, PersonalDataFormContainer, useWebsiteBuilder} from '@wepublish/website'
import {NextPageContext} from 'next'
import getConfig from 'next/config'

const ProfileWrapper = styled('div')`
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

export {GuardedProfile as default}
;(GuardedProfile as any).getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const sessionProps = await getSessionTokenProps(ctx)
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [
    ssrAuthLink(sessionProps.sessionToken?.token)
  ])

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

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    ...sessionProps,
    ...props
  }
}
