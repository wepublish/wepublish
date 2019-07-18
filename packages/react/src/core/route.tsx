import React, {useContext, useReducer, useEffect} from 'react'
import {ChildrenProps, useFetch, useEventListener} from './utility'

export enum RouteType {
  Front = 'front',
  Article = 'article',
  Page = 'page',
  External = 'external',
  NotFound = 'notFound'
}

export type Route =
  | {
      type: RouteType.Article
    }
  | {
      type: RouteType.Front
    }
  | {
      type: RouteType.Page
    }
  | {
      type: RouteType.External
      url: string
    }
  | {
      type: RouteType.NotFound
    }

export interface RouteContextState {
  current: Route
  next: string | null
}

export function reverseRoute(route: Route): string {
  // TODO
  return '/'
}

export const RouteContext = React.createContext<RouteContextState | null>(null)

export interface RouteDispatchState {}

export const RouteDispatchContext = React.createContext<RouteDispatchState | null>(null)

export function useRoute(): Route {
  const routeContext = useContext(RouteContext)

  if (!routeContext) {
    throw new Error("Couldn't find a RouteContext provider.")
  }

  return routeContext.current
}

export function useRouteDispatch(): RouteDispatchState {
  const routeDispatchContext = useContext(RouteDispatchContext)

  if (!routeDispatchContext) {
    throw new Error("Couldn't find a RouteDispatchContext provider.")
  }

  return routeDispatchContext
}

export enum RouteActionType {
  PushPath = 'pushPath',
  PushRoute = 'pushRoute'
}

export type RouteAction =
  | {
      type: RouteActionType.PushPath
      path: string
    }
  | {
      type: RouteActionType.PushRoute
      route: Route
    }

export function pushRouteAction(route: Route): RouteAction {
  return {type: RouteActionType.PushRoute, route}
}

export function pushPathAction(path: string): RouteAction {
  return {type: RouteActionType.PushPath, path}
}

export function routeReducer(state: RouteContextState, action: RouteAction): RouteContextState {
  switch (action.type) {
    case RouteActionType.PushPath:
      return {...state, next: action.path}

    case RouteActionType.PushRoute:
      return {...state, current: action.route, next: null}
  }
}

export function useRouteData(
  path: string | null,
  cb: (route: Route) => void,
  dependencies?: any[]
): void {
  useFetch(path && `/api/route${path}`, null, data => cb(data as Route), [
    path,
    ...(dependencies || [])
  ])
}

export interface RouteProviderProps extends ChildrenProps {
  initialRoute: Route
}

export function RouteProvider(props: RouteProviderProps) {
  const [state, dispatch] = useReducer(routeReducer, {
    current: props.initialRoute,
    next: null
  })

  // `dispatch` function identity will not change, but for consistency's sake we still add it to
  // the dependencies array.
  useRouteData(state.next, route => dispatch(pushRouteAction(route)), [dispatch])

  useEffect(() => {
    const path = reverseRoute(state.current)

    if (window.location.pathname !== path) {
      window.history.pushState(state.current, '', path)
    } else {
      window.history.replaceState(state.current, '', path)
    }
  }, [state.current])

  useEventListener(() => [
    window,
    'popstate',
    (e: PopStateEvent) => {
      if (e.state) {
        dispatch(pushRouteAction(e.state))
      } else {
        dispatch(pushPathAction(window.location.pathname))
      }
    }
  ])

  return (
    <RouteDispatchContext.Provider value={dispatch}>
      <RouteContext.Provider value={state}>{props.children}</RouteContext.Provider>
    </RouteDispatchContext.Provider>
  )
}
