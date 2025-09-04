import {AuthTokenStorageKey} from '@wepublish/authentication/website'
import {UserSession} from '@wepublish/website/api'
import {deleteCookie, getCookie} from 'cookies-next'
import {GetServerSidePropsContext, NextPageContext} from 'next'

export const getSessionTokenProps = async (
  ctx: GetServerSidePropsContext | NextPageContext
): Promise<{sessionToken: UserSession | null}> => {
  try {
    const token = await getCookie(AuthTokenStorageKey, {req: ctx.req})
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
