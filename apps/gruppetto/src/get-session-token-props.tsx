import {GetServerSidePropsContext, NextPageContext} from 'next'
import {AuthTokenStorageKey} from './session.provider'
import {getCookie} from 'cookies-next'
import {ApiV1} from '@wepublish/website'

export const getSessionTokenProps = async (ctx: GetServerSidePropsContext | NextPageContext) => {
  const token = getCookie(AuthTokenStorageKey, {req: ctx.req})

  const sessionToken = token ? (JSON.parse(token.toString()) as ApiV1.UserSession) : null

  return {
    sessionToken
  }
}
