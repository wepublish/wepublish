import {ApiV1, AuthTokenStorageKey, SessionTokenContext} from '@wepublish/website'
import {deleteCookie, getCookie, setCookie} from 'cookies-next'
import {memo, PropsWithChildren, useCallback, useEffect, useState} from 'react'

export const SessionProvider = memo<PropsWithChildren<{sessionToken: ApiV1.UserSession | null}>>(
  function SessionProvider({sessionToken, children}) {
    const [token, setToken] = useState<typeof sessionToken>(sessionToken)
    const [user, setUser] = useState<ApiV1.User | null>(null)

    const [getMe] = ApiV1.useMeLazyQuery({
      onCompleted(data) {
        setUser((data.me as ApiV1.User) ?? null)
      }
    })

    const setCookieAndToken = useCallback(
      (newToken: ApiV1.UserSession | null) => {
        setToken(newToken)

        if (newToken) {
          setCookie(AuthTokenStorageKey, JSON.stringify(newToken), {
            expires: new Date(newToken.expiresAt),
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
          })
          getMe()
        } else {
          setUser(null)
          deleteCookie(AuthTokenStorageKey)
        }
      },
      [getMe]
    )

    useEffect(() => {
      const cookie = getCookie(AuthTokenStorageKey)
      const sToken = sessionToken
        ? sessionToken
        : cookie
        ? (JSON.parse(cookie.toString()) as ApiV1.UserSession)
        : null

      if (sToken) {
        setCookieAndToken(sToken)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <SessionTokenContext.Provider value={[user, !!token, setCookieAndToken]}>
        {children}
      </SessionTokenContext.Provider>
    )
  }
)
