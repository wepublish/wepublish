import styled from '@emotion/styled';
import { Button, Card as MuiCard, CardContent, Drawer } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
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

const Panel = styled(MuiCard, {
  shouldForwardProp: prop => prop !== 'isEmpty',
})<{ isEmpty: boolean }>`
  display: grid;
  height: ${({ isEmpty }) => (isEmpty ? '300px' : undefined)};
  padding: 0;
  overflow: hidden;
  background-color: var(--rs-bg-well);
`;

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const IconWrapper = styled.div`
  position: absolute;
  z-index: 100;
  height: 100%;
  right: 0;
`;

// TODO: Handle disabled prop
export function EmbedBlock({
  value,
  onChange,
  autofocus,
}: BlockProps<EmbedBlockValue>) {
  const [isEmbedDialogOpen, setEmbedDialogOpen] = useState(false);
  const isEmpty = value.type === EmbedType.Other && value.url === undefined;
  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus && isEmpty) {
      setEmbedDialogOpen(true);
    }
  }, []);

  return (
    <>
      <Panel isEmpty={isEmpty}>
        <CardContent>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <PlaceholderInput
              onAddClick={() => setEmbedDialogOpen(true)}
              addLabel={t('blocks.embeds.overview.editEmbed')}
            >
              {!isEmpty && (
                <Wrapper>
                  <IconWrapper>
                    <Button
                      variant="outlined"
                      startIcon={<MdEdit />}
                      size="large"
                      onClick={() => setEmbedDialogOpen(true)}
                    >
                      {t('blocks.embeds.overview.editEmbed')}
                    </Button>
                  </IconWrapper>
                  <EmbedPreview value={value} />
                </Wrapper>
              )}
            </PlaceholderInput>
          </CardContent>
        </CardContent>
      </Panel>
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
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
  readonly value: EmbedBlockValue;
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
