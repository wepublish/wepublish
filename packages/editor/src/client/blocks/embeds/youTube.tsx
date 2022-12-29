import styled from '@emotion/styled'
import React from 'react'

const StyledIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const StyledYouTubeEmbed = styled.div`
  position: relative;
  padding-top: 56.25%;
  width: 100%;
`

export interface YouTubeVideoEmbedProps {
  videoID: string
}

export function YouTubeVideoEmbed({videoID}: YouTubeVideoEmbedProps) {
  return (
    <StyledYouTubeEmbed>
      <StyledIframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoID)}`}
        scrolling="no"
        frameBorder="0"
        allowFullScreen
      />
    </StyledYouTubeEmbed>
  )
}
