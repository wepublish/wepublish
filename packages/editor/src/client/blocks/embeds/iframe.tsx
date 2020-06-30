import React from 'react'
import {Box} from '@karma.run/ui'

export interface IframeEmbedProps {
  url?: string
  title?: string
  width?: number
  height?: number
  styleHeight?: string
  styleWidth?: string
  useRatio?: boolean
}

export function IframeEmbed({
  url,
  title,
  width = 300,
  height = 300,
  styleHeight,
  styleWidth,
  useRatio
}: IframeEmbedProps) {
  const ratioVal = width / height
  const isAutoRatio = useRatio || (useRatio && styleHeight === undefined) // if styles attributes are set in iframe and fallback fo styleHeight
  return (
    <Box width="100%">
      <Box
        position="relative"
        paddingTop={`${isAutoRatio ? (1 / ratioVal) * 100 + '%' : '0'}`}
        minHeight={'45px'}>
        <iframe
          src={url}
          title={title}
          style={{
            position: isAutoRatio ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: !isAutoRatio ? styleWidth : '100%',
            height: !isAutoRatio ? styleHeight : '100%'
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
        />
      </Box>
    </Box>
  )
}
