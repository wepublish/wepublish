import styled from '@emotion/styled'
import {
  ApiV1,
  AuthTokenStorageKey,
  LoginFormContainer,
  useUser,
  useWebsiteBuilder
} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {GetServerSideProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'
import {useEffect} from 'react'

const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
`

type LoginProps = {sessionToken?: ApiV1.UserSession}

export default function Login({sessionToken}: LoginProps) {
  const {hasUser, setToken} = useUser()
  const {
    elements: {H3, Link, Paragraph}
  } = useWebsiteBuilder()
  const router = useRouter()

  useEffect(() => {
    if (sessionToken) {
      setToken(sessionToken)
    }

    if (hasUser) {
      router.push('/')
    }
  }, [router, hasUser, sessionToken, setToken])

  return (
    <LoginWrapper>
      <H3 component="h1">Login für Abonnent*innen</H3>

      <Paragraph>
        (Falls du ein Abo lösen willst, <Link href={'/'}>klicke hier.</Link>)
      </Paragraph>

      <LoginFormContainer />
    </LoginWrapper>
  )
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
