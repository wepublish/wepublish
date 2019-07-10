import React, {useEffect, useState} from 'react'

class PromiseWrapper {
  private _callback: () => Promise<any>
  private _promise: Promise<any> | null = null
  private _isFulfilled: boolean = false
  private _value: any

  constructor(callback: () => Promise<any>) {
    this._callback = callback
  }

  public get isFulfilled() {
    return this._isFulfilled
  }

  public get value() {
    return this._value
  }

  public invokePromise() {
    if (this._promise) return this._promise

    this._promise = this._callback().then(value => {
      this._isFulfilled = true
      this._value = value

      return value
    })

    return this._promise
  }
}

// TODO: Move into context
export const promiseWrappers: {[key: string]: PromiseWrapper} = {}
export const renderedKeys: {[key: string]: boolean} = {}

export function lazy(key: string, callback: () => Promise<React.ComponentType>) {
  promiseWrappers[key] = new PromiseWrapper(callback)

  return () => {
    const [LazyComponent, setLazyComponent] = useState<React.ComponentType | null>(null)
    const wrapper = promiseWrappers[key]

    renderedKeys[key] = true

    useEffect(() => {
      wrapper.invokePromise().then(value => {
        setLazyComponent(() => value)
      })
    }, [])

    if (LazyComponent) {
      return <LazyComponent />
    }

    if (wrapper.isFulfilled) {
      return <wrapper.value />
    }

    return <div>Loading...</div>
  }
}

export async function preload(keys?: string[]): Promise<void> {
  const promises = Object.entries(promiseWrappers)
    .filter(([key]) => (keys ? keys.includes(key) : true))
    .map(([_key, wrapper]) => wrapper.invokePromise())

  await Promise.all(promises)
}

export const LazyTestComponent = lazy(
  'test',
  async () => (await import('./component')).TestComponent
)
