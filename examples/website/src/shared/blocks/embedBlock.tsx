import React from 'react'

import {EmbedData, EmbedType} from '../types'

import {FacebookPostEmbed} from '../atoms/facebookEmbed'
import {InstagramPostEmbed} from '../atoms/instagramEmbed'
import {TwitterTweetEmbed} from '../atoms/twitterEmbed'
import {YouTubeVideoEmbed} from '../atoms/youTubeEmbed'
import {VimeoEmbed} from '../atoms/vimeoEmbed'
import {SoundCloudEmbed} from '../atoms/soundCloudEmbed'
import {cssRule, useStyle} from '@karma.run/react'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {usePermanentVisibility} from '../utils/hooks'
import {transformCssStringToObject} from '../utility'

export interface EmbedBlockProps {
  readonly data: EmbedData
}

const EmbedBlockStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  marginBottom: pxToRem(50),
  padding: `0 ${pxToRem(25)}`,
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  ...whenTablet({
    width: '75%',
    maxWidth: pxToRem(900),
    margin: `0 auto ${pxToRem(70)}`,
    display: 'flex',
    justifyContent: 'center'
  }),

  ...whenDesktop({
    width: '50%',
    maxWidth: pxToRem(900),
    margin: `0 auto ${pxToRem(70)}`,
    display: 'flex',
    justifyContent: 'center'
  })
}))

function embedForData(data: EmbedData) {
  switch (data.type) {
    case EmbedType.FacebookPost:
      return <FacebookPostEmbed {...data} />

    case EmbedType.InstagramPost:
      return <InstagramPostEmbed {...data} />

    case EmbedType.TwitterTweet:
      return <TwitterTweetEmbed {...data} />

    case EmbedType.YouTubeVideo:
      return <YouTubeVideoEmbed {...data} />

    case EmbedType.VimeoVideo:
      return <VimeoEmbed {...data} />

    case EmbedType.SoundCloudTrack:
      return <SoundCloudEmbed {...data} />

    case EmbedType.IFrame:
      // TODO: Move into component

      const ratio = !!data.width && !!data.height ? data.width / data.height : 0
      const noRatio = !!data.styleCustom || ratio === 0
      const customStyleCss =
        noRatio && data.styleCustom !== ''
          ? transformCssStringToObject(data.styleCustom ?? '')
          : {
              width: '100%',
              height: '100%'
            }
      return (
        <div style={{position: 'relative', width: '100%'}}>
          <div style={{width: '100%', paddingTop: `${noRatio ? '0' : (1 / ratio) * 100 + '%'}`}} />
          <iframe
            style={{
              position: noRatio ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              border: 'none',
              ...customStyleCss
            }}
            frameBorder={0}
            scrolling="no"
            allowFullScreen
            title={data.title}
            src={data.url}
            width={data.width}
            height={data.height}
          />
        </div>
      )
  }
}

export function EmbedBlock({data}: EmbedBlockProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div ref={ref} className={css(EmbedBlockStyle)}>
      {embedForData(data)}
    </div>
  )
}
