import React, {ReactNode, useContext} from 'react'
import {
  route,
  routePath,
  RouteInstancesForRoutes,
  createRouteContext,
  RouteActionType,
  fullPathForRoute,
  zeroOrMore,
  required
} from '@karma.run/react'

import {MenuButton, LinkButton, NavigationLinkButton} from '@karma.run/ui'
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

  PageList = 'pageList',
  PageEdit = 'pageEdit',
  PageCreate = 'pageCreate',

  ImageList = 'imageList',
  ImageUpload = 'imageUpload',
  ImageEdit = 'imageEdit'
}

export const IndexRoute = route(RouteType.Index, routePath`/`)
export const LoginRoute = route(RouteType.Login, routePath`/login`)
export const LogoutRoute = route(RouteType.Logout, routePath`/logout`)

export const ArticleListRoute = route(RouteType.ArticleList, routePath`/articles`)

export const ArticleEditRoute = route(
  RouteType.ArticleEdit,
  routePath`/article/edit/${required('id')}`
)

export const ArticleCreateRoute = route(RouteType.ArticleCreate, routePath`/article/create`)

export const PageListRoute = route(RouteType.PageList, routePath`/pages`)
export const PageCreateRoute = route(RouteType.PageCreate, routePath`/page/create`)
export const PageEditRoute = route(RouteType.PageEdit, routePath`/page/edit/${required('id')}`)

export const ImageListRoute = route(RouteType.ImageList, routePath`/images`)
export const ImageUploadRoute = route(RouteType.ImageUpload, routePath`/image/upload`)

export const ImageEditRoute = route(
  RouteType.ImageEdit,
  routePath`/image/edit/${required('id')}`,
  null
)

export const NotFoundRoute = route(RouteType.NotFound, routePath`/${zeroOrMore('path')}`, null)

export const routes = [
  IndexRoute,
  LoginRoute,
  LogoutRoute,
  PageListRoute,
  PageCreateRoute,
  PageEditRoute,
  ArticleListRoute,
  ArticleCreateRoute,
  ArticleEditRoute,
  ImageListRoute,
  ImageUploadRoute,
  ImageEditRoute,
  NotFoundRoute
] as const

export const {
  Link,
  routeLink,
  RouteProvider: BaseRouteProvider,
  matchRoute,
  useRoute,
  useRouteDispatch
} = createRouteContext(routes)

export const RouteLinkButton = routeLink(LinkButton)
export const RouteMenuLinkButton = routeLink(MenuButton)
export const RouteNavigationLinkButton = routeLink(NavigationLinkButton)

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
            logout({variables: {token: session.sessionToken}})
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
