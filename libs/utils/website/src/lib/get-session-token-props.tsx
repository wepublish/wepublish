import {ApiV1, AuthTokenStorageKey} from '@wepublish/website'
import {deleteCookie, getCookie} from 'cookies-next'
import {GetServerSidePropsContext, NextPageContext} from 'next'

export const getSessionTokenProps = (
  ctx: GetServerSidePropsContext | NextPageContext
): {sessionToken: ApiV1.UserSession | null} => {
  try {
    const token = getCookie(AuthTokenStorageKey, {req: ctx.req})
    const sessionToken = token ? (JSON.parse(token.toString()) as ApiV1.UserSession) : null

    return {
      sessionToken
    }
  } catch (e) {
    console.error(e)
    deleteCookie(AuthTokenStorageKey, {req: ctx.req})

    return {sessionToken: null}
  }
}
