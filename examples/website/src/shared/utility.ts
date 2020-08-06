import {useRef, useEffect, useState, useMemo, useCallback} from 'react'

import {createRenderer} from 'fela'
import felaPrefixer from 'fela-plugin-prefixer'
import felaFallbackValue from 'fela-plugin-fallback-value'

import {onlyMobileMediaQuery, desktopMediaQuery, tabletMediaQuery} from './style/helpers'

export const PODCAST_SLUG = 'piepston'

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

// TODO: Move into Component which can auto update
export function getHumanReadableTimePassed(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const diffInDHMS = convertMSToDHMS(diff)

  if (diffInDHMS.day > 3) {
    const FormattedDate = Intl.DateTimeFormat('de-CH', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).format(date)

    const FormattedTime = Intl.DateTimeFormat('de-CH', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
    return `${FormattedDate}, ${FormattedTime}`
  }

  if (diffInDHMS.day === 1) {
    return `vor ${diffInDHMS.day} Tag`
  }

  if (diffInDHMS.day > 1) {
    return `vor ${diffInDHMS.day} Tagen`
  }

  if (diffInDHMS.hour === 1) {
    return `vor ${diffInDHMS.hour} Stunde`
  }

  if (diffInDHMS.hour > 1) {
    return `vor ${diffInDHMS.hour} Stunden`
  }

  return `vor ${diffInDHMS.minute} Minuten`
}

export function convertMSToDHMS(milliseconds: number) {
  let seconds = Math.floor(milliseconds / 1000)
  let minute = Math.floor(seconds / 60)

  seconds = seconds % 60

  let hour = Math.floor(minute / 60)

  minute = minute % 60

  let day = Math.floor(hour / 24)

  hour = hour % 24

  return {
    day: day,
    hour: hour,
    minute: minute,
    seconds: seconds
  }
}

export function createStyleRenderer() {
  return createRenderer({
    devMode: process.env.NODE_ENV !== 'production',
    mediaQueryOrder: [onlyMobileMediaQuery, tabletMediaQuery, desktopMediaQuery],
    plugins: [felaPrefixer(), felaFallbackValue()]
  })
}

export function transformCssStringToObject(styleCustom: string): object {
  const styleRules = styleCustom.split(';')
  if (styleRules.length === 0) return {}
  return styleRules.reduce((previousValue: object, currentValue: string) => {
    const [key, value] = currentValue.split(':')
    if (key && value) {
      return Object.assign(previousValue, {[key.trim()]: value.trim()})
    }
    return previousValue
  }, {})
}
