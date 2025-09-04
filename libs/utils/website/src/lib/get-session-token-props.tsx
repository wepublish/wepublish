import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {UserSession} from '@wepublish/website/api'
import {deleteCookie, getCookie} from 'cookies-next/server'
import {GetServerSidePropsContext, NextPageContext} from 'next'

export const getSessionTokenProps = (
  ctx: GetServerSidePropsContext | NextPageContext
): {sessionToken: UserSession | null} => {
  const sessionToken = getCookie(AuthTokenStorageKey, {req: ctx.req}).then(token => {
    if (token) {
      try {
        const sessionToken = JSON.parse(token.toString()) as UserSession
        return {sessionToken}
      } catch {
        deleteCookie(AuthTokenStorageKey, {req: ctx.req})
        return {sessionToken: null}
      }
    }
    return {sessionToken: null}
  })

  return sessionToken as unknown as {sessionToken: UserSession | null}

  // Old synchronous version  -- IGNORE ---
  /*
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
    */
}
