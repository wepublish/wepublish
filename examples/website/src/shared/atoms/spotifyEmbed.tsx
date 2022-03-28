import React from 'react'

export interface SpotifyEmbedProps {
  collectionType: string
  trackID: string
}

export function SpotifyEmbed({collectionType, trackID}: SpotifyEmbedProps) {
  console.log('spotify', collectionType)
  let height = 380

  if (collectionType === 'show' || collectionType === 'episode') {
    height = 232
  }
  return (
    <iframe
      style={{borderRadius: '12px'}}
      src={`https://open.spotify.com/embed/track/${trackID}?utm_source=generator}`}
      width="100%"
      height={height}
      frameBorder="0"
      allowFullScreen
    />
  )
}
