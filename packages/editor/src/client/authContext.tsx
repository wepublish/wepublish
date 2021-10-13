import React, {useEffect, createContext, Dispatch, useReducer, ReactNode} from 'react'
import {useQuery, gql} from '@apollo/client'

import {LocalStorageKey} from './utility'
import {usePageVisibility} from 'react-page-visibility'

export interface AuthContextState {
  readonly session?: {
    readonly email: string
    readonly sessionToken: string
  }
}

export const AuthContext = createContext<AuthContextState>({})

export enum AuthDispatchActionType {
  Login = 'login',
  Logout = 'logout'
}

export interface AuthDispatchLoginAction {
  readonly type: AuthDispatchActionType.Login
  readonly email: string
  readonly sessionToken: string
}

export interface AuthDispatchLogoutAction {
  readonly type: AuthDispatchActionType.Logout
}

export type AuthDispatchAction = AuthDispatchLoginAction | AuthDispatchLogoutAction

export const AuthDispatchContext = createContext<Dispatch<AuthDispatchAction>>(() => {
  throw new Error('No AuthProvider found in component tree.')
})

export function authReducer(
  prevState: AuthContextState,
  action: AuthDispatchAction
): AuthContextState {
  switch (action.type) {
    case AuthDispatchActionType.Login:
      return {
        session: {
          email: action.email,
          sessionToken: action.sessionToken
        }
      }

    case AuthDispatchActionType.Logout:
      return {}
  }
}

const MeQuery = gql`
  {
    me {
      email
    }
  }
`

export interface AuthProviderProps {
  readonly children?: ReactNode
}

export function AuthProvider({children}: AuthProviderProps) {
  const {data, loading, fetchMore: fetchAgainQuery, error} = useQuery(MeQuery)
  const [state, dispatch] = useReducer(authReducer, {})

  const isPageActive = usePageVisibility()

  // when it gets active, fetch the Me query again to know if user still logged in.
  useEffect(() => {
    fetchAgainQuery({query: MeQuery}).catch(() => {
      dispatch({
        type: AuthDispatchActionType.Logout
      })
      window.location.hash = `logout`
    })
  }, [isPageActive])

  useEffect(() => {
    if (data?.me) {
      const {email} = data.me

      dispatch({
        type: AuthDispatchActionType.Login,
        email,
        sessionToken: localStorage.getItem(LocalStorageKey.SessionToken)!
      })
    } else {
      dispatch({
        type: AuthDispatchActionType.Logout
      })
    }
  }, [data?.me, error])

  return loading ? null : (
    <AuthDispatchContext.Provider value={dispatch}>
      {<AuthContext.Provider value={state}>{children}</AuthContext.Provider>}
    </AuthDispatchContext.Provider>
  )
}
