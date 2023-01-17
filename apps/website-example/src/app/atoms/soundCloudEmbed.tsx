import React from 'react'
import {SoundCloudTrackEmbedData} from '../types'
import {Color} from '../style/colors'

export function SoundCloudEmbed({trackID}: SoundCloudTrackEmbedData) {
  // prettier-ignore
  return (
    <iframe
      width="100%"
      height="300"
      scrolling="0"
      frameBorder="0"
      src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${encodeURIComponent(trackID)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
      style={{
        backgroundColor: Color.NeutralLight}}
    />
  )
}
