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

      previousValue.current = value
      setValue(newVal)

      return sessionStorage.setItem(key, serializeRef.current(newVal))
    },
    [key, value]
  )

  useEffect(() => {
    const item = sessionStorage.getItem(key)

    if (item) {
      setValue(deserializeRef.current(item))
    }
  }, [key, defaultValue])

  return [value, previousValue, set, remove] as const
}
