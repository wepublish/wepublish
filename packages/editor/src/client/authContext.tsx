import React, {useEffect} from 'react'
import {createContext, Dispatch, useReducer, ReactNode} from 'react'
import {LocalStorageKey} from './utility'

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

export interface AuthProviderProps {
  readonly children?: ReactNode
}

export function AuthProvider({children}: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {})
  const {sessionToken} = state.session || {}

  useEffect(() => {
    if (sessionToken) {
      localStorage.setItem(LocalStorageKey.SessionToken, sessionToken)
    } else {
      localStorage.removeItem(LocalStorageKey.SessionToken)
    }
  }, [sessionToken])

  return (
    <AuthDispatchContext.Provider value={dispatch}>
      {<AuthContext.Provider value={state}>{children}</AuthContext.Provider>}
    </AuthDispatchContext.Provider>
  )
}
