import React from 'react'
import {YouTubeVideoEmbedData} from '../types'
import {Color} from '../style/colors'

export function YouTubeVideoEmbed({videoID}: YouTubeVideoEmbedData) {
  return (
    <div style={{position: 'relative', paddingTop: '56.25%', width: '100%'}}>
      <iframe
        src={`https://www.youtube.com/embed/${encodeURIComponent(videoID)}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: Color.NeutralLight
        }}
        frameBorder="0"
        allowFullScreen
      />
    </div>
  )
}
