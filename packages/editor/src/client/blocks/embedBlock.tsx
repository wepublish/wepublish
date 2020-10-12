import React, {useState, useEffect, useContext} from 'react'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Box,
  Spacing,
  IconButton,
  ZIndex,
  Card,
  ThemeContext
} from '@karma.run/ui'

import {MaterialIconEditOutlined} from '@karma.run/icons'
import {EmbedEditPanel} from '../panel/embedEditPanel'
import {EmbedBlockValue, EmbedType} from './types'
import {YouTubeVideoEmbed} from './embeds/youTube'
import {VimeoVideoEmbed} from './embeds/vimeo'
import {SoundCloudTrackEmbed} from './embeds/soundCloud'
import {InstagramPostEmbed} from './embeds/instagram'
import {TwitterTweetEmbed} from './embeds/twitter'
import {FacebookPostEmbed, FacebookVideoEmbed} from './embeds/facebook'
import {IframeEmbed} from './embeds/iframe'

// TODO: Handle disabled prop
export function EmbedBlock({value, onChange, autofocus}: BlockProps<EmbedBlockValue>) {
  const theme = useContext(ThemeContext)
  const [isEmbedDialogOpen, setEmbedDialogOpen] = useState(false)
  const isEmpty = value.type === EmbedType.Other && value.url === undefined

  useEffect(() => {
    if (autofocus && isEmpty) {
      setEmbedDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Card
        height={isEmpty ? 300 : undefined}
        overflow="hidden"
        style={{backgroundColor: theme.colors.light}}>
        <PlaceholderInput onAddClick={() => setEmbedDialogOpen(true)}>
          {!isEmpty && (
            <Box position="relative" width="100%">
              <Box position="absolute" zIndex={ZIndex.Default} height="100%" right={0}>
                <IconButton
                  icon={MaterialIconEditOutlined}
                  title="Edit Embed"
                  onClick={() => setEmbedDialogOpen(true)}
                  margin={Spacing.ExtraSmall}
                />
              </Box>
              <EmbedPreview value={value} />
            </Box>
          )}
        </PlaceholderInput>
      </Card>
      <Drawer open={isEmbedDialogOpen} width={480}>
        {() => (
          <EmbedEditPanel
            value={value}
            onClose={() => setEmbedDialogOpen(false)}
            onConfirm={value => {
              setEmbedDialogOpen(false)
              onChange(value)
            }}
          />
        )}
      </Drawer>
    </>
  )
}

export interface EmbedPreviewProps {
  readonly value: EmbedBlockValue
}

export function EmbedPreview({value}: EmbedPreviewProps) {
  switch (value.type) {
    case EmbedType.FacebookPost:
      return <FacebookPostEmbed userID={value.userID} postID={value.postID} />

    case EmbedType.FacebookVideo:
      return <FacebookVideoEmbed userID={value.userID} videoID={value.videoID} />

    case EmbedType.InstagramPost:
      return <InstagramPostEmbed postID={value.postID} />

    case EmbedType.TwitterTweet:
      return <TwitterTweetEmbed userID={value.userID} tweetID={value.tweetID} />

    case EmbedType.VimeoVideo:
      return <VimeoVideoEmbed videoID={value.videoID} />

    case EmbedType.YouTubeVideo:
      return <YouTubeVideoEmbed videoID={value.videoID} />

    case EmbedType.SoundCloudTrack:
      return <SoundCloudTrackEmbed trackID={value.trackID} />

    default:
      return value.url ? (
        <IframeEmbed
          title={value.title}
          url={value.url}
          width={value.width}
          height={value.height}
          styleCustom={value.styleCustom}
        />
      ) : null
  }
}
