import React, {useEffect, useState, useCallback, useMemo, useContext, ReactNode} from 'react'

class PromiseWrapper {
  private _callback: () => Promise<any>
  private _promise: Promise<any> | null = null

  private _isFulfilled: boolean = false
  private _isResolved: boolean = false
  private _isRejected: boolean = false

  private _value: any
  private _error: any

  constructor(callback: () => Promise<any>) {
    this._callback = callback
  }

  public get isFulfilled() {
    return this._isFulfilled
  }

  public get isResolved() {
    return this._isResolved
  }

  public get isRejected() {
    return this._isRejected
  }

  public get value() {
    return this._value
  }

  public get error() {
    return this._error
  }

  public invokePromise() {
    if (this._promise) return this._promise

    this._promise = this._callback()
      .then(value => {
        this._isFulfilled = true
        this._isResolved = true
        this._value = value.default

        return this._value
      })
      .catch(err => {
        this._isFulfilled = true
        this._isRejected = true
        this._error = err

        return this._error
      })

    return this._promise
  }
}

interface LazyCaptureContextType {
  notifyRender(path: string): void
}

export const LazyCaptureContext = React.createContext<LazyCaptureContextType | null>(null)

export interface LazyCaptureProps {
  rendered: string[]
  children?: ReactNode
}

export function LazyCapture(props: LazyCaptureProps) {
  const notifyRender = useCallback((path: string) => {
    props.rendered.push(path)
  }, [])

  const context = useMemo(() => ({notifyRender}), [])

  return <LazyCaptureContext.Provider value={context}>{props.children}</LazyCaptureContext.Provider>
}

const lazyPromiseRegistry: {[key: string]: PromiseWrapper} = {}

export function lazy(path: string, callback: () => Promise<{default: React.ComponentType}>) {
  if (lazyPromiseRegistry[path]) {
    console.warn(`Path "${path}" is already registered as a lazy component.`)
  }

  lazyPromiseRegistry[path] = new PromiseWrapper(callback)

  return () => {
    const [LazyComponent, setLazyComponent] = useState()
    const captureContext = useContext(LazyCaptureContext)
    const wrapper = lazyPromiseRegistry[path]

    if (captureContext) {
      captureContext.notifyRender(path)
    }

    useEffect(() => {
      if (!wrapper.isFulfilled) {
        wrapper.invokePromise().then(value => {
          setLazyComponent(() => value)
        })
      }
    })

    if (LazyComponent) {
      return <LazyComponent />
    }

    if (wrapper.isFulfilled) {
      return <wrapper.value />
    }

    if (typeof window === 'undefined') {
      throw new Error(
        `Path ${path} wasn't loaded on the server, did you forget to call "preloadAllLazyComponents"?`
      )
    }

    return <div>Loading...</div>
  }
}

export async function preloadAllLazyComponents() {
  function arePromisesFullfilled() {
    return Object.entries(lazyPromiseRegistry).find(([_key, wrapper]) => !wrapper.isFulfilled)
  }

  while (arePromisesFullfilled()) {
    const promises = Object.entries(lazyPromiseRegistry).map(([_key, wrapper]) =>
      wrapper.invokePromise()
    )

    await Promise.all(promises)
  }
}

export async function preloadLazyComponents(keys: string[]): Promise<void> {
  function arePromisesFullfilled() {
    return Object.entries(lazyPromiseRegistry).find(
      ([key, wrapper]) => keys.includes(key) && !wrapper.isFulfilled
    )
  }

  while (arePromisesFullfilled()) {
    const promises = Object.entries(lazyPromiseRegistry)
      .filter(([key]) => keys.includes(key))
      .map(([_key, wrapper]) => wrapper.invokePromise())

    await Promise.all(promises)
  }
}
