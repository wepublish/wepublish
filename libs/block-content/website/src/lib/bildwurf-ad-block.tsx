import {useEffect} from 'react'
import {BildwurfAdBlock as BildwurfAdBlockType, Block} from '@wepublish/website/api'

import styled from '@emotion/styled'
import {BuilderBildwurfAdBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

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
  const {Script} = useWebsiteBuilder()

  useEffect(() => {
    try {
      window._ASO.loadAd('bildwurf-injection-wrapper', zoneID)
    } catch (error) {
      console.warn('could not call _ASO.loadAd()')
    }
  }, [])

  return (
    <>
      <Script src="https://media.online.bildwurf.ch/js/code.min.js" />
      <BildwurfBlockWrapper className={className} id="bildwurf-injection-wrapper">
        <ins className="aso-zone" data-zone={zoneID}></ins>
      </BildwurfBlockWrapper>
    </>
  )
}
