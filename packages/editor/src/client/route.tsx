import React, {ReactNode, useContext} from 'react'
import {
  route,
  routePath,
  RouteInstancesForRoutes,
  createRouteContext,
  RouteActionType,
  fullPathForRoute,
  zeroOrMore,
  optional,
  required
} from '@karma.run/react'

import {PrimaryButton, MenuIconButton} from '@karma.run/ui'
import {AuthContext, AuthDispatchContext, AuthDispatchActionType} from './authContext'
import {useMutation} from '@apollo/react-hooks'
import {LocalStorageKey} from './utility'
import gql from 'graphql-tag'

export enum RouteType {
  Login = 'login',
  Logout = 'logout',
  Index = 'index',
  NotFound = 'notFound',

  ArticleList = 'articleList',
  ArticleEdit = 'articleEdit',
  ArticleCreate = 'articleCreate',

  FrontList = 'frontList',

  MediaList = 'mediaList'
}

export const IndexRoute = route(RouteType.Index, routePath`/`, null)
export const LoginRoute = route(RouteType.Login, routePath`/login`, null)
export const LogoutRoute = route(RouteType.Logout, routePath`/logout`, null)
export const ArticleListRoute = route(RouteType.ArticleList, routePath`/article/list`, null)
export const FrontListRoute = route(RouteType.FrontList, routePath`/front/list`, null)

export const ArticleEditRoute = route(
  RouteType.ArticleEdit,
  routePath`/article/edit/${required('id')}`,
  null
)

export const ArticleCreateRoute = route(RouteType.ArticleCreate, routePath`/article/create`, null)

export const MediaListRoute = route(RouteType.MediaList, routePath`/media/list`, null)

export const NotFoundRoute = route(RouteType.NotFound, routePath`/${zeroOrMore('path')}`, null)

export const routes = [
  IndexRoute,
  LoginRoute,
  LogoutRoute,
  FrontListRoute,
  ArticleListRoute,
  ArticleEditRoute,
  ArticleCreateRoute,
  MediaListRoute,
  NotFoundRoute
] as const

export const {
  Link,
  createLinkHOC,
  RouteProvider: BaseRouteProvider,
  matchRoute,
  useRoute,
  useRouteDispatch
} = createRouteContext(routes)

export const LinkPrimaryButton = createLinkHOC(PrimaryButton)
export const LinkMenuIconButton = createLinkHOC(MenuIconButton)

export type Route = RouteInstancesForRoutes<typeof routes>

export interface RouteProviderProps {
  readonly children?: ReactNode
}

const LogoutMutation = gql`
  mutation Logout($token: String!) {
    revokeSession(token: $token)
  }
`

export function RouteProvider({children}: RouteProviderProps) {
  const [logout] = useMutation(LogoutMutation)
  const {session} = useContext(AuthContext)
  const authDispatch = useContext(AuthDispatchContext)

  return (
    <BaseRouteProvider
      handleNextRoute={(next, dispatch) => {
        if (next.type === RouteType.Logout) {
          if (session) {
            logout({variables: {token: session!.sessionToken}})
            localStorage.removeItem(LocalStorageKey.SessionToken)
            authDispatch({type: AuthDispatchActionType.Logout})
          }

          dispatch({type: RouteActionType.ReplaceRoute, route: LoginRoute.create({})})
        } else if (next.type === RouteType.Login) {
          if (session) {
            dispatch({type: RouteActionType.SetCurrentRoute, route: IndexRoute.create({})})
          } else {
            dispatch({
              type: RouteActionType.SetCurrentRoute,
              route: next
            })
          }
        } else {
          if (session) {
            dispatch({type: RouteActionType.SetCurrentRoute, route: next})
          } else {
            dispatch({
              type: RouteActionType.SetCurrentRoute,
              route: LoginRoute.create(
                {},
                {
                  query: next.type !== RouteType.Index ? {next: fullPathForRoute(next)} : undefined
                }
              )
            })
          }
        }

        return () => {}
      }}>
      {children}
    </BaseRouteProvider>
  )
}
