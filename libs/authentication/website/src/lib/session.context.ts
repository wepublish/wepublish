import {UserSession, User} from '@wepublish/website/api'
import {createContext, Dispatch, SetStateAction, useContext} from 'react'

export const AuthTokenStorageKey = 'auth.token'

export const SessionTokenContext = createContext<
  [User | null, boolean, Dispatch<SetStateAction<UserSession | null>>]
>(null!)

export const useUser = () => {
  const [user, hasUser, setToken] = useContext(SessionTokenContext)

  const logout = async () => {
    setToken(null)
  }

  return {user, hasUser, setToken, logout}
}
