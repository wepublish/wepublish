import {
  createRouteContext,
  route,
  routePath,
  required,
  RouteInstancesForRoutes,
  zeroOrMore,
  optional
} from '@karma.run/react'

import {PublishedArticle} from '../types'

export enum RouteType {
  PeerArticle = 'peerArticle',
  Article = 'article',
  Page = 'page',
  Tag = 'tag',
  Peer = 'peer',
  Author = 'author',
  Modal = 'modal',
  Login = 'login',
  Logout = 'logout'
}

export const PeerArticleRoute = route(
  RouteType.PeerArticle,
  routePath`/needs_to_be_fixed/${required('peerID')}/${required('id')}/${optional('slug')}`,
  null as PublishedArticle | null
)

export const ArticleRoute = route(
  RouteType.Article,
  routePath`/a/${required('id')}/${optional('slug')}`,
  null as PublishedArticle | null
)

export const PageRoute = route(RouteType.Page, routePath`/${zeroOrMore('slug')}`, null)
export const TagRoute = route(RouteType.Tag, routePath`/tag/${required('tag')}`, null)
export const AuthorRoute = route(RouteType.Author, routePath`/author/${required('id')}`, null)

export const LoginRoute = route(RouteType.Login, routePath`/login`)
export const LogoutRoute = route(RouteType.Logout, routePath`/logout`)

export const routes = [
  LoginRoute,
  LogoutRoute,
  PeerArticleRoute,
  ArticleRoute,
  TagRoute,
  AuthorRoute,
  PageRoute
] as const

export const {Link, RouteProvider, matchRoute, useRoute, useRouteDispatch} = createRouteContext(
  routes
)

export type Route = RouteInstancesForRoutes<typeof routes>
