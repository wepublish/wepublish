import React, {useEffect} from 'react'
import {useScript} from '../utility'

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

export function BildwurfAdEmbed({zoneID}: BildwurfAdEmbedProps) {
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
    <div id="bildwurf-injection-wrapper" style={{width: '100%'}}>
      <ins className="aso-zone" data-zone={zoneID}></ins>
    </div>
  )
}
