import {useCallback, useEffect} from 'react'
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

  const loadAd = useCallback(() => {
    try {
      window._ASO.loadAd('bildwurf-injection-wrapper', zoneID)
    } catch (error) {
      // do nothing
    }
  }, [zoneID])

  useEffect(() => {
    loadAd()
  }, [loadAd])

  return (
    <>
      <Script src="https://media.online.bildwurf.ch/js/code.min.js" onLoad={loadAd} />

      <BildwurfBlockWrapper
        className={className}
        dangerouslySetInnerHTML={{
          // Inject it dynamically so that React does not track it.
          // Bildwurf will dynamically change the DOM which can break the application on navigation
          __html: `
            <div id="bildwurf-injection-wrapper">
              <ins className="aso-zone" data-zone="${zoneID}"></ins>
            </div>
          `
        }}
      />
    </>
  )
}
