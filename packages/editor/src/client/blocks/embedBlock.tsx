import React, {useEffect, useState} from 'react'

import {PlaceholderInput} from '../atoms/placeholderInput'
import {Drawer, IconButton, Panel} from 'rsuite'

import {BlockProps} from '../atoms/blockList'

import {EmbedEditPanel} from '../panel/embedEditPanel'
import {EmbedBlockValue, EmbedType} from './types'
import {YouTubeVideoEmbed} from './embeds/youTube'
import {VimeoVideoEmbed} from './embeds/vimeo'
import {SoundCloudTrackEmbed} from './embeds/soundCloud'
import {InstagramPostEmbed} from './embeds/instagram'
import {TwitterTweetEmbed} from './embeds/twitter'
import {FacebookPostEmbed, FacebookVideoEmbed} from './embeds/facebook'
import {PolisEmbed} from './embeds/polis'
import {IframeEmbed} from './embeds/iframe'

import {useTranslation} from 'react-i18next'
import {BildwurfAdEmbed} from './embeds/bildwurfAd'
import {TikTokVideoEmbed} from './embeds/tikTok'
import PencilIcon from '@rsuite/icons/legacy/Pencil'

// TODO: Handle disabled prop
export function EmbedBlock({value, onChange, autofocus}: BlockProps<EmbedBlockValue>) {
  const [isEmbedDialogOpen, setEmbedDialogOpen] = useState(false)
  const isEmpty = value.type === EmbedType.Other && value.url === undefined
  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus && isEmpty) {
      setEmbedDialogOpen(true)
    }
  }, [])

  return (
    <>
      <Panel
        bodyFill
        bordered
        style={{
          height: isEmpty ? 300 : undefined,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#f7f9fa'
        }}>
        <PlaceholderInput onAddClick={() => setEmbedDialogOpen(true)}>
          {!isEmpty && (
            <div
              style={{
                position: 'relative',
                width: '100%'
              }}>
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  height: '100%',
                  right: 0
                }}>
                <IconButton
                  size={'lg'}
                  icon={<PencilIcon />}
                  onClick={() => setEmbedDialogOpen(true)}>
                  {t('blocks.embeds.overview.editEmbed')}
                </IconButton>
              </div>
              <EmbedPreview value={value} />
            </div>
          )}
        </PlaceholderInput>
      </Panel>
      <Drawer size={'sm'} open={isEmbedDialogOpen} onClose={() => setEmbedDialogOpen(false)}>
        <EmbedEditPanel
          value={value}
          onClose={() => setEmbedDialogOpen(false)}
          onConfirm={value => {
            setEmbedDialogOpen(false)
            onChange(value)
          }}
        />
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

    case EmbedType.PolisConversation:
      return <PolisEmbed conversationID={value.conversationID} />

    case EmbedType.TikTokVideo:
      return <TikTokVideoEmbed userID={value.userID} videoID={value.videoID} />

    case EmbedType.BildwurfAd:
      return <BildwurfAdEmbed zoneID={value.zoneID} />

    default:
      return value.url ? (
        <IframeEmbed
          title={value.title}
          url={value.url}
          width={value.width}
          height={value.height}
          styleCustom={value.styleCustom}
          sandbox={value.sandbox}
        />
      ) : null
  }
}
