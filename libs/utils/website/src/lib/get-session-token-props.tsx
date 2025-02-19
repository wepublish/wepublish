import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {deleteCookie, getCookie} from 'cookies-next'
import {GetServerSidePropsContext, NextPageContext} from 'next'

export const getSessionTokenProps = (
  ctx: GetServerSidePropsContext | NextPageContext
): {sessionToken: UserSession | null} => {
  try {
    const token = getCookie(AuthTokenStorageKey, {req: ctx.req})
    const sessionToken = token ? (JSON.parse(token.toString()) as UserSession) : null

    return {
      sessionToken
    }
  } catch (e) {
    console.error(e)
    deleteCookie(AuthTokenStorageKey, {req: ctx.req})

    return {sessionToken: null}
  }
}
