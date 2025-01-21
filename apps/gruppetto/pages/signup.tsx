import {Typography} from '@mui/material'
import styled from '@emotion/styled'
import {
  ApiV1,
  IntendedRouteStorageKey,
  RegistrationFormContainer,
  useUser,
  useWebsiteBuilder
} from '@wepublish/website'
import {deleteCookie, getCookie} from 'cookies-next'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

const SignupWrapper = styled('div')`
  display: grid;
  justify-content: center;
`

export default function SignUp() {
  const {hasUser} = useUser()
  const router = useRouter()
  const {
    elements: {H3, Link}
  } = useWebsiteBuilder()

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString()
    deleteCookie(IntendedRouteStorageKey)
    const route = intendedRoute ?? '/profile'

    router.replace(route)
  }

  return (
    <SignupWrapper>
      <H3 component="h1">Registriere dich noch heute</H3>

      <Typography variant="body1" paragraph>
        (Falls du schon einen Account hast, <Link href={'/login'}>klicke hier</Link> und falls du
        ein Abo lösen willst, <Link href={'/abo'}>klicke hier.</Link>)
      </Typography>

      <RegistrationFormContainer />
    </SignupWrapper>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.API_URL) {
    return {props: {}, revalidate: 1}
  }

  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL, [])
  await Promise.all([
    client.query({
      query: ApiV1.NavigationListDocument
    }),
    client.query({
      query: ApiV1.PeerProfileDocument
    })
  ])

  const props = ApiV1.addClientCacheToV1Props(client, {})

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
