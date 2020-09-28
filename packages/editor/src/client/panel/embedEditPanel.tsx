import React, {useState, useEffect} from 'react'
import {MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  TextArea,
  Spacing,
  Typography,
  Box
} from '@karma.run/ui'

import {EmbedPreview} from '../blocks/embedBlock'
import {EmbedBlockValue, EmbedType} from '../blocks/types'

export interface EmbedEditPanel {
  readonly value: EmbedBlockValue
  onClose(): void
  onConfirm(value: EmbedBlockValue): void
}

export function EmbedEditPanel({value, onClose, onConfirm}: EmbedEditPanel) {
  const [errorMessage, setErrorMessage] = useState<string>()
  const [input, setInput] = useState(() => deriveInputFromEmbedBlockValue(value))
  const [embed, setEmbed] = useState<EmbedBlockValue>(value)
  const isEmpty = embed.type === EmbedType.Other && embed.url === undefined

  useEffect(() => {
    setErrorMessage(undefined)

    const facebookPostMatch = input.match(/facebook.com\/(.+)\/posts\/([0-9]+)/)
    const facebookVideoMatch = input.match(/facebook.com\/(.+)\/videos\/([0-9]+)/)
    const instagramMatch = input.match(/instagram.com\/p\/([0-9a-zA-Z-_]+)/)
    const twitterMatch = input.match(/twitter.com\/([0-9a-zA-Z-_]+)\/status\/([0-9]+)/)
    const vimeoMatch = input.match(/vimeo.com\/([0-9]+)/)
    const youTubeMatch = input.match(/youtube.com\/watch\?v=([0-9a-zA-Z-_]+)/)

    if (facebookPostMatch) {
      const [, userID, postID] = facebookPostMatch
      setEmbed({type: EmbedType.FacebookPost, userID, postID})
    } else if (facebookVideoMatch) {
      const [, userID, videoID] = facebookVideoMatch
      setEmbed({type: EmbedType.FacebookVideo, userID, videoID})
    } else if (instagramMatch) {
      const [, postID] = instagramMatch
      setEmbed({type: EmbedType.InstagramPost, postID})
    } else if (twitterMatch) {
      const [, userID, tweetID] = twitterMatch
      setEmbed({type: EmbedType.TwitterTweet, userID, tweetID})
    } else if (vimeoMatch) {
      const [, videoID] = vimeoMatch
      setEmbed({type: EmbedType.VimeoVideo, videoID})
    } else if (youTubeMatch) {
      const [, videoID] = youTubeMatch
      setEmbed({type: EmbedType.YouTubeVideo, videoID})
    } else {
      if (input) {
        const parser = new DOMParser()
        const element = parser.parseFromString(input, 'text/html')
        const [iframe] = element.getElementsByTagName('iframe')

        if (iframe) {
          const soundCloudMatch = iframe.src.match(/api.soundcloud.com\/tracks\/([0-9]+)/)
          if (soundCloudMatch) {
            const [, trackID] = soundCloudMatch
            setEmbed({type: EmbedType.SoundCloudTrack, trackID})
          } else {
            // add iframe attributes if set in input
            const setEmbedOther = {
              title: iframe.title,
              width: iframe.width ? parseInt(iframe.width) : undefined,
              height: iframe.height ? parseInt(iframe.height) : undefined,
              styleCustom: !!iframe.style && !!iframe.style.cssText ? iframe.style.cssText : ''
            }

            setEmbed({
              type: EmbedType.Other,
              url: iframe.src,
              ...setEmbedOther
            })
          }
        } else {
          try {
            setEmbed({type: EmbedType.Other, url: new URL(input).toString()})
          } catch {
            setEmbed({type: EmbedType.Other})
            setErrorMessage('Invalid URL or iframe code')
          }
        }
      } else {
        setEmbed({type: EmbedType.Other})
      }
    }
  }, [input])

  return (
    <Panel>
      <PanelHeader
        title="Edit Embed"
        leftChildren={
          <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose()} />
        }
        rightChildren={
          <NavigationButton
            icon={MaterialIconCheck}
            label="Confirm"
            onClick={() => onConfirm(embed)}
            disabled={isEmpty}
          />
        }
      />
      <PanelSection>
        <TextArea
          marginBottom={Spacing.ExtraSmall}
          label="Embed"
          errorMessage={errorMessage}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <Box marginBottom={Spacing.ExtraSmall}>
          <Typography variant="subtitle1" spacing="small">
            Facebook Post/Video, Instagram Post, Twitter Tweet, Vimeo Video, YouTube Video formatted
            like e.g.
          </Typography>
          <code>https://www.facebook.com/id/posts/id/</code>
          <Typography variant="subtitle1" spacing="small">
            Embed codes attributes <code>title, src, width, height</code> are validated e.g.
          </Typography>
          <code>{'<iframe width="560" height="315" src="https://..."></iframe>'}</code>
          <Typography variant="subtitle1" spacing="small">
            Set <code>style</code> alternatively as attribute to overwrite the defaults and disable
            auto ratio size scaling .e.g.
          </Typography>
          <code>{'<iframe style="height:350px;width:100%;" src="https://..."></iframe>'}</code>
          <Typography variant="subtitle1" spacing="small">
            Due to validation, shareable peers and GDPR-compliant, embedding blocks are currently
            limited to simple iframes and supported embeds listed above.
          </Typography>
        </Box>

        <EmbedPreview value={embed} />
      </PanelSection>
    </Panel>
  )
}

function deriveInputFromEmbedBlockValue(embed: EmbedBlockValue) {
  switch (embed.type) {
    case EmbedType.FacebookPost:
      return `https://www.facebook.com/${embed.userID}/posts/${embed.postID}/`

    case EmbedType.FacebookVideo:
      return `https://www.facebook.com/${embed.userID}/videos/${embed.videoID}/`

    case EmbedType.InstagramPost:
      return `https://www.instagram.com/p/${embed.postID}/`

    case EmbedType.TwitterTweet:
      return `https://twitter.com/${embed.userID}/status/${embed.tweetID}/`

    case EmbedType.VimeoVideo:
      return `https://vimeo.com/${embed.videoID}`

    case EmbedType.YouTubeVideo:
      return `https://www.youtube.com/watch?v=${embed.videoID}`

    case EmbedType.SoundCloudTrack:
      return `https://api.soundcloud.com/tracks/${embed.trackID}`

    case EmbedType.Other: {
      const hasTitle = !!embed.title
      const hasHeight = !!embed.height
      const hasWidth = !!embed.width
      const hasStyles = !!embed.styleCustom
      return embed.url
        ? `<iframe src="${embed.url}"${hasTitle ? ` title="${embed.title}"` : ''}${
            hasWidth ? ` width="${embed.width}"` : ''
          }${hasHeight ? ` height="${embed.height}"` : ''}${
            hasStyles ? ` style="${embed.styleCustom}"` : ''
          }/>`
        : ''
    }
  }
}
