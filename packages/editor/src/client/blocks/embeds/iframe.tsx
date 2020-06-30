import React from 'react'
import {Box} from '@karma.run/ui'

export interface IframeEmbedProps {
  url?: string
  title?: string
  width?: number
  height?: number
  styleHeight?: string
  styleWidth?: string
  ratio?: boolean
}

export function IframeEmbed({
  url,
  title,
  width = 300,
  height = 300,
  styleHeight,
  styleWidth,
  ratio
}: IframeEmbedProps) {
  const ratioVal = width / height
  const styles = {}
  if (!ratio) {
    Object.assign(styles, {
      width: styleWidth,
      height: styleHeight
    })
  }
  return (
    <Box width="100%">
      <Box
        position="relative"
        paddingTop={`${ratio || styleHeight === undefined ? (1 / ratioVal) * 100 + '%' : '0'}`}
        width="100%"
        minHeight={'45px'}>
        <iframe
          src={url}
          title={title}
          style={{
            position: ratio ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            ...styles
          }}
          scrolling="yes"
          frameBorder="0"
          allowFullScreen
        />
      </Box>
    </Box>
  )
}
