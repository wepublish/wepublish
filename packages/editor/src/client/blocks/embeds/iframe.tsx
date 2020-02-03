import React from 'react'
import {Box} from '@karma.run/ui'

export interface IframeEmbedProps {
  url?: string
  title?: string
  width?: number
  height?: number
}

export function IframeEmbed({url, title, width = 300, height = 300}: IframeEmbedProps) {
  const ratio = width / height

  return (
    <Box width="100%">
      <Box position="relative" paddingTop={`${(1 / ratio) * 100}%`} width="100%">
        <iframe
          src={url}
          title={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
        />
      </Box>
    </Box>
  )
}
