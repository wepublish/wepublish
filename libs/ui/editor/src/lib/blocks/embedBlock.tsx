import styled from '@emotion/styled';
import { Drawer } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import { DRAWER_WIDTHS } from '../drawer';
import { EmbedEditPanel } from '../panel/embedEditPanel';
import { BildwurfAdEmbed } from './embeds/bildwurfAd';
import { FacebookPostEmbed, FacebookVideoEmbed } from './embeds/facebook';
import { IframeEmbed } from './embeds/iframe';
import { InstagramPostEmbed } from './embeds/instagram';
import { PolisEmbed } from './embeds/polis';
import { SoundCloudTrackEmbed } from './embeds/soundCloud';
import { StreamableVideoEmbed } from './embeds/streamable';
import { TikTokVideoEmbed } from './embeds/tikTok';
import { TwitterTweetEmbed } from './embeds/twitter';
import { VimeoVideoEmbed } from './embeds/vimeo';
import { YouTubeVideoEmbed } from './embeds/youTube';
import { EmbedBlockValue, EmbedType } from './types';

const Preview = styled('div')`
  display: grid;
  justify-items: center;
  overflow: hidden;
`;

export function EmbedBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: BlockProps<EmbedBlockValue>) {
  const isEmpty = value.type === EmbedType.Other && value.url === undefined;
  const { t } = useTranslation();
  const [isEmbedDialogOpen, setEmbedDialogOpen] = useState(
    () => Boolean(autofocus) && isEmpty
  );

  return (
    <>
      <BlockPreviewCard
        isEmpty={isEmpty}
        emptyLabel={t('blocks.embeds.overview.editEmbed')}
        editLabel={t('blocks.embeds.overview.editEmbed')}
        onEdit={() => setEmbedDialogOpen(true)}
        title={t('blocks.embeds.label')}
        disabled={disabled}
      >
        <Preview>
          <EmbedPreview value={value} />
        </Preview>
      </BlockPreviewCard>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isEmbedDialogOpen}
        onClose={() => setEmbedDialogOpen(false)}
      >
        <EmbedEditPanel
          value={value}
          onClose={() => setEmbedDialogOpen(false)}
          onConfirm={value => {
            setEmbedDialogOpen(false);
            onChange(value);
          }}
        />
      </Drawer>
    </>
  );
}

export interface EmbedPreviewProps {
  value: EmbedBlockValue;
}

export function EmbedPreview({ value }: EmbedPreviewProps) {
  switch (value.type) {
    case EmbedType.FacebookPost:
      return (
        <FacebookPostEmbed
          userID={value.userID}
          postID={value.postID}
        />
      );

    case EmbedType.FacebookVideo:
      return (
        <FacebookVideoEmbed
          userID={value.userID}
          videoID={value.videoID}
        />
      );

    case EmbedType.InstagramPost:
      return <InstagramPostEmbed postID={value.postID} />;

    case EmbedType.TwitterTweet:
      return (
        <TwitterTweetEmbed
          userID={value.userID}
          tweetID={value.tweetID}
        />
      );

    case EmbedType.VimeoVideo:
      return <VimeoVideoEmbed videoID={value.videoID} />;

    case EmbedType.YouTubeVideo:
      return <YouTubeVideoEmbed videoID={value.videoID} />;

    case EmbedType.SoundCloudTrack:
      return <SoundCloudTrackEmbed trackID={value.trackID} />;

    case EmbedType.PolisConversation:
      return <PolisEmbed conversationID={value.conversationID} />;

    case EmbedType.TikTokVideo:
      return (
        <TikTokVideoEmbed
          userID={value.userID}
          videoID={value.videoID}
        />
      );

    case EmbedType.BildwurfAd:
      return <BildwurfAdEmbed zoneID={value.zoneID} />;

    case EmbedType.StreamableVideo:
      return <StreamableVideoEmbed videoID={value.videoID} />;

    default:
      return value.url ?
          <IframeEmbed
            title={value.title}
            url={value.url}
            width={value.width}
            height={value.height}
            styleCustom={value.styleCustom}
            sandbox={value.sandbox}
          />
        : null;
  }
}
