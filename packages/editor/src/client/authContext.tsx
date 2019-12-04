import React, {useEffect} from 'react'
import {createContext, Dispatch, useReducer, ReactNode} from 'react'
import {LocalStorageKey} from './utility'
import gql from 'graphql-tag'
import {useQuery, useMutation} from '@apollo/react-hooks'

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
  const {data, loading} = useQuery(MeQuery)
  const [state, dispatch] = useReducer(authReducer, {})

  useEffect(() => {
    if (data) {
      const {email} = data.me

      dispatch({
        type: AuthDispatchActionType.Login,
        email,
        sessionToken: localStorage.getItem(LocalStorageKey.SessionToken)!
      })
    }
  }, [data])

  return loading ? null : (
    <AuthDispatchContext.Provider value={dispatch}>
      {<AuthContext.Provider value={state}>{children}</AuthContext.Provider>}
    </AuthDispatchContext.Provider>
  )
}
