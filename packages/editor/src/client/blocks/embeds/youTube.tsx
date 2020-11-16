import React from 'react'

export interface YouTubeVideoEmbedProps {
  videoID: string
}

export function YouTubeVideoEmbed({videoID}: YouTubeVideoEmbedProps) {
  return (
    <div
      style={{
        position: 'relative',
        paddingTop: '56.25%',
        width: '100%'
      }}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoID)}`}
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
