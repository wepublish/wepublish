import React from 'react'

export interface VimeoVideoEmbedProps {
  videoID: string
}

export function VimeoVideoEmbed({videoID}: VimeoVideoEmbedProps) {
  return (
    <div
      style={{
        position: 'relative',
        paddingTop: '56.25%',
        width: '100%'
      }}>
      <iframe
        src={`https://player.vimeo.com/video/${encodeURIComponent(videoID)}`}
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
    </div>
  )
}
