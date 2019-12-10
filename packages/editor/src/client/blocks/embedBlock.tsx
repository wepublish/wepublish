import React, {useState, useEffect} from 'react'

import {
  PlaceholderInput,
  Drawer,
  BlockProps,
  Box,
  Layer,
  LayerContainer,
  Spacing,
  IconButton,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {MaterialIconEditOutlined} from '@karma.run/icons'
import {EmbedEditPanel} from '../panel/embedEditPanel'

export enum EmbedType {
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  Other = 'other'
}

export interface FacebookPostEmbed {
  readonly type: EmbedType.FacebookPost
  readonly userID: string
  readonly postID: string
}

export interface InstagramPostEmbed {
  readonly type: EmbedType.InstagramPost
  readonly postID: string
}

export interface TwitterTweetEmbed {
  readonly type: EmbedType.TwitterTweet
  readonly userID: string
  readonly tweetID: string
}

export interface VimeoVideoEmbed {
  readonly type: EmbedType.VimeoVideo
  readonly videoID: string
}

export interface YouTubeVideoEmbed {
  readonly type: EmbedType.YouTubeVideo
  readonly videoID: string
}

export interface SoundCloudTrackEmbed {
  readonly type: EmbedType.SoundCloudTrack
  readonly trackID: string
}

export interface OtherEmbed {
  readonly type: EmbedType.Other
  readonly url?: string
  readonly title?: string
  readonly width?: number
  readonly height?: number
}

export type EmbedBlockValue =
  | FacebookPostEmbed
  | InstagramPostEmbed
  | TwitterTweetEmbed
  | VimeoVideoEmbed
  | YouTubeVideoEmbed
  | SoundCloudTrackEmbed
  | OtherEmbed

// TODO: Handle disabled prop
export function EmbedBlock({value, onChange, autofocus}: BlockProps<EmbedBlockValue>) {
  const [isEmbedDialogOpen, setEmbedDialogOpen] = useState(false)
  const isEmpty = value.type === EmbedType.Other && value.url == undefined

  useEffect(() => {
    if (autofocus && isEmpty) {
      setEmbedDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Box height={300}>
        <PlaceholderInput onAddClick={() => setEmbedDialogOpen(true)}>
          {!isEmpty && (
            <LayerContainer>
              <Layer right={0} top={0}>
                <IconButton
                  icon={MaterialIconEditOutlined}
                  title="Edit Embed"
                  onClick={() => setEmbedDialogOpen(true)}
                  margin={Spacing.ExtraSmall}
                />
              </Layer>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
                height="100%">
                <EmbedPreview value={value} />
              </Box>
            </LayerContainer>
          )}
        </PlaceholderInput>
      </Box>
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
      return (
        <DescriptionList>
          <DescriptionListItem label="Type">Facebook Post</DescriptionListItem>
          <DescriptionListItem label="User ID">{value.userID}</DescriptionListItem>
          <DescriptionListItem label="Post ID">{value.postID}</DescriptionListItem>
        </DescriptionList>
      )

    case EmbedType.InstagramPost:
      return (
        <DescriptionList>
          <DescriptionListItem label="Type">Instagram Post</DescriptionListItem>
          <DescriptionListItem label="Post ID">{value.postID}</DescriptionListItem>
        </DescriptionList>
      )

    case EmbedType.TwitterTweet:
      return (
        <DescriptionList>
          <DescriptionListItem label="Type">Twitter Tweet</DescriptionListItem>
          <DescriptionListItem label="Tweet ID">{value.tweetID}</DescriptionListItem>
        </DescriptionList>
      )

    case EmbedType.VimeoVideo:
      return (
        <DescriptionList>
          <DescriptionListItem label="Type">Vimeo Video</DescriptionListItem>
          <DescriptionListItem label="Video ID">{value.videoID}</DescriptionListItem>
        </DescriptionList>
      )

    case EmbedType.YouTubeVideo:
      return (
        <DescriptionList>
          <DescriptionListItem label="Type">YouTube</DescriptionListItem>
          <DescriptionListItem label="User ID">{value.videoID}</DescriptionListItem>
        </DescriptionList>
      )

    case EmbedType.SoundCloudTrack:
      return (
        <DescriptionList>
          <DescriptionListItem label="Type">Soundcloud Track</DescriptionListItem>
          <DescriptionListItem label="Track ID">{value.trackID}</DescriptionListItem>
        </DescriptionList>
      )

    default:
      return value.url ? (
        <DescriptionList>
          <DescriptionListItem label="Type">Other</DescriptionListItem>
          {value.url && <DescriptionListItem label="URL">{value.url}</DescriptionListItem>}
          {value.title && <DescriptionListItem label="Title">{value.title}</DescriptionListItem>}
          {value.width && <DescriptionListItem label="Width">{value.width}</DescriptionListItem>}
          {value.height && <DescriptionListItem label="Height">{value.height}</DescriptionListItem>}
        </DescriptionList>
      ) : null
  }
}
