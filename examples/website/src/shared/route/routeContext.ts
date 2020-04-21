import {
  createRouteContext,
  route,
  routePath,
  required,
  RouteInstancesForRoutes,
  zeroOrMore
} from '@karma.run/react'

import {PublishedArticle} from '../types'

export enum RouteType {
  Article = 'article',
  Page = 'page',
  Tag = 'tag',
  Peer = 'peer',
  Author = 'author',
  Modal = 'modal'
}

export const ArticleRoute = route(
  RouteType.Article,
  routePath`/a/${required('id')}/${zeroOrMore('slug')}`,
  null as PublishedArticle | null
)

export const PageRoute = route(RouteType.Page, routePath`/${zeroOrMore('slug')}`, null)
export const TagRoute = route(RouteType.Tag, routePath`/tag/${required('tag')}`, null)
export const PeerRoute = route(RouteType.Peer, routePath`/peer/${required('id')}`, null)
export const AuthorRoute = route(RouteType.Author, routePath`/author/${required('id')}`, null)

export const routes = [ArticleRoute, TagRoute, PeerRoute, AuthorRoute, PageRoute] as const

export const {Link, RouteProvider, matchRoute, useRoute, useRouteDispatch} = createRouteContext(
  routes
)

export type Route = RouteInstancesForRoutes<typeof routes>
