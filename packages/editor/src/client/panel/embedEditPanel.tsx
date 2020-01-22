import React, {useState, useEffect} from 'react'
import {MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {NavigationButton, Panel, PanelHeader, PanelSection, TextArea, Spacing} from '@karma.run/ui'

import {EmbedPreview} from '../blocks/embedBlock'
import {EmbedBlockValue, EmbedType} from '../api/blocks'

export interface EmbedEditPanel {
  readonly value: EmbedBlockValue

  onClose(): void
  onConfirm(value: EmbedBlockValue): void
}

export function EmbedEditPanel({value, onClose, onConfirm}: EmbedEditPanel) {
  const [errorMessage, setErrorMessage] = useState<string>()

  const [input, setInput] = useState('')
  const [embed, setEmbed] = useState<EmbedBlockValue>(value)

  const isEmpty = embed.type === EmbedType.Other && embed.url == undefined

  useEffect(() => {
    setErrorMessage(undefined)

    const faceBookMatch = input.match(/facebook.com\/(.+)\/posts\/([0-9]+)/)
    const instagramMatch = input.match(/instagram.com\/p\/([0-9a-zA-Z-_]+)/)
    const twitterMatch = input.match(/twitter.com\/([0-9a-zA-Z-_]+)\/status\/([0-9]+)/)
    const vimeoMatch = input.match(/vimeo.com\/([0-9]+)/)
    const youTubeMatch = input.match(/youtube.com\/watch\?v=([0-9a-zA-Z-_]+)/)

    if (faceBookMatch) {
      const [, userID, postID] = faceBookMatch
      setEmbed({type: EmbedType.FacebookPost, userID, postID})
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
            setEmbed({
              type: EmbedType.Other,
              url: iframe.src,
              title: iframe.title,
              width: iframe.width ? parseInt(iframe.width) : undefined,
              height: iframe.height ? parseInt(iframe.height) : undefined
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
          marginBottom={Spacing.Large}
          description="Link to Facebook Post, Instagram Post, Twitter Tweet, Vimeo Video, YouTube Video or iframe embed code"
          label="Embed"
          errorMessage={errorMessage}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <EmbedPreview value={embed} />
      </PanelSection>
    </Panel>
  )
}
