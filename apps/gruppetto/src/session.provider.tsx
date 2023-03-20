import {UserSession, useMeLazyQuery, User} from '@wepublish/website/api'
import {deleteCookie, setCookie} from 'cookies-next'
import {memo, PropsWithChildren, useEffect, useState} from 'react'
import {SessionTokenContext} from '@wepublish/authentication/website'

export const AuthTokenStorageKey = 'auth.token'

export const SessionProvider = memo<PropsWithChildren<{sessionToken: UserSession | null}>>(
  ({sessionToken, children}) => {
    const [token, setToken] = useState(sessionToken)
    const [user, setUser] = useState<User | null>(null)

    const [getMe] = useMeLazyQuery({
      onCompleted(data) {
        setUser((data.me as User) ?? null)
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
