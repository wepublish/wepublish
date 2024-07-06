import {styled, Typography} from '@mui/material'
import {ApiV1, RegistrationFormContainer, useUser, useWebsiteBuilder} from '@wepublish/website'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useEffect} from 'react'

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

  useEffect(() => {
    if (hasUser) {
      router.replace('/')
    }
  }, [router, hasUser])

  return (
    <SignupWrapper>
      <H3 component="h1">Registriere dich noch heute</H3>

      <Typography variant="body1" paragraph>
        (Falls du schon einen Account hast, <Link href={'/login'}>klicke hier.</Link>)
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
