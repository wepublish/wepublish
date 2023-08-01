import {useEffect, useState, useRef, useCallback, useMemo} from 'react'
import {BildwurfAdBlock as BildwurfAdBlockType, Block} from '@wepublish/website/api'

import styled from '@emotion/styled'
import {BuilderBildwurfAdBlockProps} from '@wepublish/website/builder'

function useScript(src: string, checkIfLoaded: () => boolean, crossOrigin = false) {
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
  }, [isLoading, crossOrigin, src, isLoaded])

  const load = useCallback(() => {
    setLoading(true)
  }, [])

  const result = useMemo(
    () => ({
      isLoading,
      isLoaded,
      load
    }),
    [isLoading, isLoaded, load]
  )

  if (typeof window !== 'object') {
    return {
      isLoaded: false,
      isLoading: false,
      load: () => {
        /* do nothing */
      }
    }
  }

  return result
}

export const isBildwurfAdBlock = (block: Block): block is BildwurfAdBlockType =>
  block.__typename === 'BildwurfAdBlock'

export const BildwurfBlockWrapper = styled('div')``

declare global {
  interface Window {
    _ASO: {
      loadAd(param1: string, param2: string): void
    }
  }
}

export interface BildwurfAdEmbedProps {
  zoneID: string
}

export function BildwurfAdBlock({zoneID, className}: BuilderBildwurfAdBlockProps) {
  const {load} = useScript(
    `https://media.online.bildwurf.ch/js/code.min.js`,
    () => !!window._ASO,
    false
  )

  useEffect(() => {
    load()
    try {
      window._ASO.loadAd('bildwurf-injection-wrapper', zoneID)
    } catch (error) {
      console.warn('could not call _ASO.loadAd()')
    }
  }, [])

  return (
    <BildwurfBlockWrapper className={className} id="bildwurf-injection-wrapper">
      <ins className="aso-zone" data-zone={zoneID}></ins>
    </BildwurfBlockWrapper>
  )
}
