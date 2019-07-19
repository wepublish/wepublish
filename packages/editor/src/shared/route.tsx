import {createRouteContext} from '@wepublish/react'

export enum RouteType {
  Front = 'front',
  Article = 'article',
  Page = 'page',
  External = 'external',
  NotFound = 'notFound'
}

export interface ArticleRoute {
  type: RouteType.Article
}

export interface FrontRoute {
  type: RouteType.Front
}

export interface PageRoute {
  type: RouteType.Page
}

export interface ExternalRoute {
  type: RouteType.External
  url: string
}

export interface NotFoundRoute {
  type: RouteType.NotFound
}

export type Route = ArticleRoute | FrontRoute | PageRoute | ExternalRoute | NotFoundRoute

export function reverseRoute(route: Route) {
  switch (route.type) {
    case RouteType.Article:
      // TODO
      return `/article/${''}`

    case RouteType.Page:
      // TODO
      return `/page/${''}`

    case RouteType.Front:
      // TODO
      return `/${''}`

    case RouteType.NotFound:
      return '/404'

    case RouteType.External:
      return route.url
  }
}

export function queryRoute(path: string, callback: (route: Route) => void) {
  callback({type: RouteType.Article})
  return () => {}
}

export const {
  RouteProvider,
  pushPathAction,
  pushRouteAction,
  useRoute,
  useRouteDispatch
} = createRouteContext(reverseRoute, queryRoute)
