import {ApiV1, AuthTokenStorageKey} from '@wepublish/website'
import {getCookie} from 'cookies-next'
import {GetServerSidePropsContext, NextPageContext} from 'next'

export const getSessionTokenProps = (
  ctx: GetServerSidePropsContext | NextPageContext
): {sessionToken: ApiV1.UserSession | null} => {
  const token = getCookie(AuthTokenStorageKey, {req: ctx.req})

  const sessionToken = token ? (JSON.parse(token.toString()) as ApiV1.UserSession) : null

  return {
    sessionToken
  }
}
