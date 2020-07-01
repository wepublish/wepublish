import React from 'react'
import {Box} from '@karma.run/ui'

export interface IframeEmbedProps {
  url?: string
  title?: string
  width?: number
  height?: number
  styleHeight?: string
  styleWidth?: string
}

export function IframeEmbed({
  url,
  title,
  width,
  height,
  styleHeight,
  styleWidth
}: IframeEmbedProps) {
  const ratioVal = width !== undefined && height !== undefined ? width / height : 0
  const disableAutoRatio = !!styleHeight || !!styleWidth
  return (
    <Box width="100%">
      <Box
        position="relative"
        paddingTop={`${!disableAutoRatio && ratioVal > 0 ? (1 / ratioVal) * 100 + '%' : '0'}`}
        minHeight={'45px'}>
        <iframe
          src={url}
          title={title}
          style={{
            position: !disableAutoRatio ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: disableAutoRatio ? styleWidth : '100%',
            height: disableAutoRatio ? styleHeight : '100%'
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
        />
      </Box>
    </Box>
  )
}
