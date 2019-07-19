import React, {useContext, useReducer, useEffect, ComponentType, Dispatch} from 'react'
import {ChildrenProps, useEventListener} from './utility'

export interface RouteContextState<T = any> {
  current: T
  next: string | null
}

export const RouteContext = React.createContext<RouteContextState | null>(null)

export type RouteDispatchContextState<T = any> = Dispatch<RouteAction<T>>
export const RouteDispatchContext = React.createContext<RouteDispatchContextState | null>(null)

export enum RouteActionType {
  PushPath = 'pushPath',
  PushRoute = 'pushRoute'
}

export interface PushPathAction {
  type: RouteActionType.PushPath
  path: string
}

export interface PushRouteAction<T = any> {
  type: RouteActionType.PushRoute
  route: T
}

export type RouteAction<T = any> = PushPathAction | PushRouteAction<T>

export function routeReducer(state: RouteContextState, action: RouteAction): RouteContextState {
  switch (action.type) {
    case RouteActionType.PushPath:
      return {...state, next: action.path}

    case RouteActionType.PushRoute:
      return {...state, current: action.route, next: null}
  }
}

export interface RouteProviderProps<T = any> extends ChildrenProps {
  initialRoute: T
}

export interface CreateRouteContextResult<T> {
  RouteProvider: ComponentType<RouteProviderProps<T>>
  useRoute: () => T
  useRouteDispatch: () => RouteDispatchContextState<T>
  pushRouteAction: (route: T) => PushRouteAction<T>
  pushPathAction: (path: string) => PushPathAction
}

export type RouteReverseFn<T> = (route: T) => string
export type RouteDataQueryFn<T> = (path: string, callback: (data: T) => void) => () => void

export function createRouteContext<T>(
  reverseRoute: RouteReverseFn<T>,
  queryRoute: RouteDataQueryFn<T>
): CreateRouteContextResult<T> {
  function pushRouteAction(route: T): PushRouteAction<T> {
    return {type: RouteActionType.PushRoute, route}
  }

  function pushPathAction(path: string): PushPathAction {
    return {type: RouteActionType.PushPath, path}
  }

  function RouteProvider(props: RouteProviderProps) {
    const [state, dispatch] = useReducer(routeReducer, {
      current: props.initialRoute,
      next: null
    })

    // `dispatch` function identity will not change, but for consistency's sake we still add it to
    // the dependencies array.
    useEffect(() => {
      if (!state.next) return

      const cancel = queryRoute(state.next, () => {})
      return cancel
    }, [state.next, dispatch])

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

  function useRoute(): T {
    const routeContext = useContext(RouteContext)

    if (!routeContext) {
      throw new Error(
        "Couldn't find a RouteContext provider, did you forget to include RouteProvider in the component tree."
      )
    }

    return routeContext.current
  }

  function useRouteDispatch(): RouteDispatchContextState<T> {
    const routeDispatchContext = useContext(RouteDispatchContext)

    if (!routeDispatchContext) {
      throw new Error(
        "Couldn't find a RouteDispatchContext provider, did you forget to include RouteProvider in the component tree."
      )
    }

    return routeDispatchContext
  }

  return {
    RouteProvider,
    pushRouteAction,
    pushPathAction,
    useRoute,
    useRouteDispatch
  }
}
