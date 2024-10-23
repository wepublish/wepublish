import {styled, Typography} from '@mui/material'
import {IntendedRouteStorageKey} from '@wepublish/website'
import {
  ApiV1,
  AuthTokenStorageKey,
  LoginFormContainer,
  useUser,
  useWebsiteBuilder
} from '@wepublish/website'
import {deleteCookie, getCookie, setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useEffect} from 'react'

const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
  gap: ${({theme}) => theme.spacing(3)};
  max-width: 600px;
  justify-self: center;
`

type LoginProps = {sessionToken?: ApiV1.UserSession}

export default function Login({sessionToken}: LoginProps) {
  const {hasUser, setToken} = useUser()
  const {
    elements: {H3, Link}
  } = useWebsiteBuilder()
  const router = useRouter()

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken)
    }
  }, [sessionToken, setToken])

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString()
    deleteCookie(IntendedRouteStorageKey)
    const route = intendedRoute ?? '/profile'

    router.replace(route)
  }

  return (
    <LoginWrapper>
      <H3 component="h1">Login für Abonnent*innen</H3>

      <Typography variant="h6" paragraph>
        «MAIL-LOGIN»: Beim ersten Login kannst du dich mit deiner bei uns hinterlegten
        E-Mail-Adresse (ohne Passwort) anmelden. Lege danach ein Passwort in deinem Nutzerprofil
        fest für zukünftiges Einloggen unter «LOGIN MIT PASSWORT»
      </Typography>

      <Typography variant="body1" paragraph>
        Du hast noch kein Abo und möchtest LGBTIQ-Journalismus unterstützen?
        <Link href={'/mitmachen'}> Hier kannst du dein Abo wählen.</Link>
      </Typography>

      <LoginFormContainer />
    </LoginWrapper>
  )
}

Login.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const client = ApiV1.getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

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

    return {
      props: {
        sessionToken: data.data.createSessionWithJWT
      }
    }
  }

  return {
    props: {}
  }
}
