import {useCallback, useEffect, useRef, useState} from 'react'

type UseSessionStorageProps<I> = {
  defaultValue?: I
  serialize: (value: I) => string
  deserialize: (value: string) => I
}

export const useSessionStorage = <I>(
  key: string,
  {defaultValue, serialize, deserialize}: UseSessionStorageProps<I>
) => {
  const serializeRef = useRef(serialize)
  const deserializeRef = useRef(deserialize)
  const [value, setValue] = useState(defaultValue)
  const previousValue = useRef(defaultValue)
  const currentValue = useRef(defaultValue)

  const remove = useCallback(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    return sessionStorage.removeItem(key)
  }, [key])

  const set = useCallback(
    (newVal: I) => {
      if (typeof window === 'undefined') {
        return undefined
      }

      setValue(newVal)

      sessionStorage.setItem(key, serializeRef.current(newVal))
      window.dispatchEvent(new StorageEvent('storage'))
    },
    [key]
  )

  useEffect(() => {
    if (currentValue.current !== value) {
      previousValue.current = currentValue.current
      currentValue.current = value
    }
  }, [value])

  useEffect(() => {
    const item = sessionStorage.getItem(key)

    if (item) {
      setValue(deserializeRef.current(item))
    }
  }, [key, defaultValue])

  useEffect(() => {
    const storageEventListener = function (e: StorageEvent) {
      // manually fired event
      if (!e.storageArea) {
        const item = sessionStorage.getItem(key)
        setValue(item ? deserializeRef.current(item) : undefined)
      }
    }

    window.addEventListener('storage', storageEventListener)

    return () => {
      window.removeEventListener('storage', storageEventListener)
    }
  }, [key])

  return [value, previousValue, set, remove] as const
}
