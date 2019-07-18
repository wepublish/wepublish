import {ReactNode, useEffect} from 'react'

export interface ChildrenProps {
  children: ReactNode
}

export function useFetch(
  input: RequestInfo | null,
  init: Omit<RequestInit, 'signal'> | null,
  cb: (data: unknown) => void,
  dependencies?: any[]
): void {
  useEffect(() => {
    if (!input) return

    const abortController = new AbortController()
    async function loadRouteData() {
      try {
        const response = await fetch(input!, {
          ...init,
          signal: abortController.signal
        })

        cb(await response.json())
      } catch {}
    }

    loadRouteData()

    return () => abortController.abort()
  }, dependencies)
}

export interface EventListenerEffect<T extends EventTarget, E extends Event> {
  (): [T, string, (e: E) => void]
}

export function useEventListener<T extends EventTarget, E extends Event>(
  effect: EventListenerEffect<T, E>
) {
  useEffect(() => {
    const [target, event, callback] = effect()
    target.addEventListener(event, callback as EventListener)
    return () => target.removeEventListener(event, callback as EventListener)
  })
}
