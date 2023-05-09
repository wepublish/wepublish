import {SessionTokenContext, ApiV1} from '@wepublish/website'
import {deleteCookie, setCookie} from 'cookies-next'
import {memo, PropsWithChildren, useEffect, useState} from 'react'

export const AuthTokenStorageKey = 'auth.token'

export const SessionProvider = memo<PropsWithChildren<{sessionToken: ApiV1.UserSession | null}>>(
  ({sessionToken, children}) => {
    const [token, setToken] = useState(sessionToken)
    const [user, setUser] = useState<ApiV1.User | null>(null)

    const [getMe] = ApiV1.useMeLazyQuery({
      onCompleted(data) {
        setUser((data.me as ApiV1.User) ?? null)
      }
    })

    useEffect(() => {
      if (token) {
        setCookie(AuthTokenStorageKey, token, {
          expires: new Date(token.expiresAt)
        })
        getMe()
      } else {
        setUser(null)
        deleteCookie(AuthTokenStorageKey)
      }
    }, [token, getMe])

    return (
      <SessionTokenContext.Provider value={[user, !!token, setToken]}>
        {children}
      </SessionTokenContext.Provider>
    )
  }
)

SessionProvider.displayName = 'SessionProvider'
