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
  Modal = 'modal',
  Member = 'memberwerden',
  Archiv = 'briefingarchiv',
  PayRexxFull = 'full',
  PayRexxGoenner = 'goenner',
  PayRexxMember = 'member',
  BaselBriefing = 'baselbriefing'
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
export const MemberRoute = route(RouteType.Member, routePath`/memberwerden`, null)
export const ArchivRoute = route(RouteType.Archiv, routePath`/briefingarchiv`, null)
export const PayRexxFullRoute = route(RouteType.PayRexxFull, routePath`/full`, null)
export const PayRexxGoennerRoute = route(RouteType.PayRexxGoenner, routePath`/goenner`, null)
export const PayRexxMemberRoute = route(RouteType.PayRexxMember, routePath`/member`, null)
export const BaselBriefingRoute = route(RouteType.BaselBriefing, routePath`/baselbriefing`, null)

export const routes = [
  MemberRoute,
  ArchivRoute,
  PayRexxFullRoute,
  PayRexxGoennerRoute,
  PayRexxMemberRoute,
  BaselBriefingRoute,
  ArticleRoute,
  TagRoute,
  PeerRoute,
  AuthorRoute,
  PageRoute
] as const

export const {Link, RouteProvider, matchRoute, useRoute, useRouteDispatch} = createRouteContext(
  routes
)

export type Route = RouteInstancesForRoutes<typeof routes>
