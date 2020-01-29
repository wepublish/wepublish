import baseSlugify from 'slugify'
import {useRef, useState, useEffect, useCallback, useMemo} from 'react'

export enum LocalStorageKey {
  SessionToken = 'sessionToken'
}

export function slugify(value: string) {
  return baseSlugify(value, {lower: true}) // TODO: Replace with custom slugify
}

// https://gist.github.com/WebReflection/6076a40777b65c397b2b9b97247520f0
export function dateTimeLocalString(date: Date) {
  function prefix(i: number) {
    return (i < 10 ? '0' : '') + i
  }

  const year = date.getFullYear()
  const month = prefix(date.getMonth() + 1)
  const day = prefix(date.getDate())
  const hours = prefix(date.getHours())
  const minutes = prefix(date.getMinutes())
  const seconds = prefix(date.getSeconds())

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export function useScript(src: string, checkIfLoaded: () => boolean, crossOrigin: boolean = false) {
  if (typeof window != 'object') return {isLoaded: false, isLoading: false, load: () => {}}

  const scriptRef = useRef<HTMLScriptElement | null>(null)

  const [isLoading, setLoading] = useState(false)
  const [isLoaded, setLoaded] = useState(() => checkIfLoaded())

  useEffect(() => {
    if (isLoading && !isLoaded && !scriptRef.current) {
      const script = document.createElement('script')

      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => setLoaded(true)
      script.crossOrigin = crossOrigin ? 'anonymous' : null

      document.head.appendChild(script)
      scriptRef.current = script
    }
  }, [isLoading])

  const load = useCallback(() => {
    setLoading(true)
  }, [])

  return useMemo(
    () => ({
      isLoading,
      isLoaded,
      load
    }),
    [isLoading, isLoaded, load]
  )
}
