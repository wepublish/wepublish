import React, {useEffect} from 'react'
import {createContext, Dispatch, useReducer, ReactNode} from 'react'
import {useMutation} from '@apollo/react-hooks'
import gql from 'graphql-tag'

export interface AuthContextState {
  readonly session?: {
    readonly email: string
    readonly refreshToken: string
    readonly accessToken: string
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
  readonly refreshToken: string
  readonly accessToken: string
}

export interface AuthDispatchLogoutAction {
  readonly type: AuthDispatchActionType.Logout
}

export type AuthDispatchAction = AuthDispatchLoginAction | AuthDispatchLogoutAction

export const AuthDispatchContext = createContext<Dispatch<AuthDispatchAction>>(() => {
  throw new Error('No AuthProvider found in component tree.')
})

export function authReducer(
  _prevState: AuthContextState,
  action: AuthDispatchAction
): AuthContextState {
  switch (action.type) {
    case AuthDispatchActionType.Login:
      return {
        session: {
          email: action.email,
          refreshToken: action.refreshToken,
          accessToken: action.accessToken
        }
      }

    case AuthDispatchActionType.Logout:
      return {}
  }
}

const AuthWithTokenQuery = gql`
  mutation AuthenticateWithToken($token: String!) {
    authenticateWithToken(token: $token) {
      user {
        email
      }
      accessToken
      accessTokenExpiresIn
    }
  }
`

export interface AuthProviderProps {
  readonly children?: ReactNode
}

export function AuthProvider({children}: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {})
  const [authenticate, {loading}] = useMutation(AuthWithTokenQuery)
  const {session: {refreshToken = undefined} = {}} = state

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
  }, [refreshToken])

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken')

    if (refreshToken) {
      authenticate({variables: {token: refreshToken}}).then(response => {
        const {
          accessToken,
          user: {email}
        } = response.data.authenticateWithToken

        dispatch({type: AuthDispatchActionType.Login, email, refreshToken, accessToken})
      })
    }
  }, [])

  return loading ? null : (
    <AuthDispatchContext.Provider value={dispatch}>
      {<AuthContext.Provider value={state}>{children}</AuthContext.Provider>}
    </AuthDispatchContext.Provider>
  )
}
