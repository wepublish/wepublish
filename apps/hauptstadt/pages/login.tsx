import {
  AuthTokenStorageKey,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser
} from '@wepublish/authentication/website'
import {ContentWidthProvider} from '@wepublish/content/website'
import {PageContainer} from '@wepublish/page/website'
import {getSessionTokenProps} from '@wepublish/utils/website'
import {addClientCacheToV1Props, PageDocument, UserSession} from '@wepublish/website/api'
import {getV1ApiClient, LoginWithJwtDocument} from '@wepublish/website/api'
import {deleteCookie, getCookie, setCookie} from 'cookies-next'
import {NextPageContext} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useEffect, useRef} from 'react'

type LoginProps = {sessionToken?: UserSession}

export default function Login({sessionToken}: LoginProps) {
  const {hasUser, setToken} = useUser()
  const router = useRouter()
  const isRedirecting = useRef(false)

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken)
    }
  }, [sessionToken, setToken])

  if (hasUser && typeof window !== 'undefined') {
    const intendedRoute = getCookie(IntendedRouteStorageKey)?.toString()
    deleteCookie(IntendedRouteStorageKey)
    const route = intendedRoute ?? '/profile'

    if (!isRedirecting.current) {
      router.replace(route)
      isRedirecting.current = true
    }
  }

  return (
    <ContentWidthProvider fullWidth>
      <PageContainer slug="login">
        <LoginFormContainer
          defaults={{
            email: router.query?.mail as string | undefined,
            requirePassword: !!router.query?.requirePassword
          }}
        />
      </PageContainer>
    </ContentWidthProvider>
  )
}

Login.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {}
  }

  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

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
      sameSite: 'strict',
      httpOnly: true
    })

    return await getSessionTokenProps(ctx)
  }

  await Promise.all([
    client.query({
      query: PageDocument,
      variables: {
        slug: 'login'
      }
    })
  ])
  const props = addClientCacheToV1Props(client, {})

  return props
}
