import React, {useEffect} from 'react'
import {useScript} from '../../utility'

export interface BildwurfAdEmbedProps {
  zoneID: string
}

export function BildwurfAdEmbed({zoneID}: BildwurfAdEmbedProps) {
  const randomNumber = new Date().getTime()

  const {load} = useScript(
    `https://media.online.bildwurf.ch/js/code.min.js?timestamp=${randomNumber}`,
    () => false,
    false
  )

  useEffect(() => {
    load()
  }, [])

  return (
    <div id="bildwurf-injection-wrapper">
      <ins className="aso-zone" data-zone={zoneID}></ins>
    </div>
  )
}
