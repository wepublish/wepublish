import {ApiV1, AuthTokenStorageKey, LoginFormContainer, useUser} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {GetServerSideProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useEffect} from 'react'

type LoginProps = {sessionToken?: ApiV1.UserSession}

export default function Login({sessionToken}: LoginProps) {
  const {hasUser, setToken} = useUser()
  const router = useRouter()

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken)
    }

    if (hasUser) {
      router.push('/')
    }
  }, [router, hasUser, sessionToken, setToken])

  return <LoginFormContainer subscriptionPath="/" />
}

export const getServerSideProps: GetServerSideProps = async ctx => {
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
