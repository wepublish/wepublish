import React, {useState, useEffect} from 'react'

import {PlaceholderInput} from '../atoms/placeholderInput'
import {Drawer, Panel, IconButton, Icon} from 'rsuite'

import {BlockProps} from '../atoms/blockList'

import {EmbedEditPanel} from '../panel/embedEditPanel'
import {EmbedBlockValue, EmbedType} from './types'
import {YouTubeVideoEmbed} from './embeds/youTube'
import {VimeoVideoEmbed} from './embeds/vimeo'
import {SoundCloudTrackEmbed} from './embeds/soundCloud'
import {InstagramPostEmbed} from './embeds/instagram'
import {TwitterTweetEmbed} from './embeds/twitter'
import {FacebookPostEmbed, FacebookVideoEmbed} from './embeds/facebook'
import {IframeEmbed} from './embeds/iframe'

import {useTranslation} from 'react-i18next'

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
        bodyFill={true}
        bordered={true}
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
                  zIndex: 1,
                  height: '100%',
                  right: 0
                }}>
                <IconButton
                  size={'lg'}
                  icon={<Icon icon="pencil" />}
                  onClick={() => setEmbedDialogOpen(true)}>
                  {t('blocks.embeds.overview.editEmbed')}
                </IconButton>
              </div>
              <EmbedPreview value={value} />
            </div>
          )}
        </PlaceholderInput>
      </Panel>
      <Drawer size={'sm'} show={isEmbedDialogOpen} onHide={() => setEmbedDialogOpen(false)}>
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
