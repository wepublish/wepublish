import styled from '@emotion/styled';
import { Alert, Button, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmbedPreview } from '../blocks/embedBlock';
import { EmbedBlockValue, EmbedType } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { parseEmbedInput } from './parseEmbedInput';

const Metadata = styled.div`
  margin-bottom: 8px;
`;

const Input = styled(TextField)`
  width: 100%;
`;

export interface EmbedEditPanel {
  value: EmbedBlockValue;
  onClose(): void;
  onConfirm(value: EmbedBlockValue): void;
}

export function EmbedEditPanel({ value, onClose, onConfirm }: EmbedEditPanel) {
  const [input, setInput] = useState(() =>
    deriveInputFromEmbedBlockValue(value)
  );
  const { t } = useTranslation();

  const { embed, invalidURL } = useMemo(() => parseEmbedInput(input), [input]);
  const errorMessage =
    invalidURL ? t('blocks.embeds.panels.invalidURL') : undefined;
  const isEmpty = embed.type === EmbedType.Other && embed.url === undefined;

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('blocks.embeds.panels.editEmbed')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="contained"
            disabled={isEmpty}
            onClick={() => onConfirm(embed)}
          >
            {t('blocks.embeds.panels.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('blocks.embeds.panels.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <TextField
          rows={3}
          placeholder={t('blocks.embeds.panels.embed')}
          value={input}
          onChange={event => setInput(event.target.value)}
          multiline
        />
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <Metadata>
          <Typography>{t('blocks.embeds.panels.socialMediaList')}</Typography>
          <code>{t('blocks.embeds.panels.fbPosts')}</code>
          <Typography>
            {t('blocks.embeds.panels.embedCodeAttributes')}
          </Typography>
          <code>{t('blocks.embeds.panels.iframe1Sample')}</code>
          <Typography>
            {t('blocks.embeds.panels.alternativeStyling')}
          </Typography>
          <code>{t('blocks.embeds.panels.iframe2Sample')}</code>
          <Typography>{t('blocks.embeds.panels.GDPRInfo')}</Typography>
        </Metadata>
        <EmbedPreview value={embed} />
      </DrawerBody>
    </>
  );
}

function deriveInputFromEmbedBlockValue(embed: EmbedBlockValue) {
  switch (embed.type) {
    case EmbedType.FacebookPost:
      return `https://www.facebook.com/${embed.userID}/posts/${embed.postID}/`;

    case EmbedType.FacebookVideo:
      return `https://www.facebook.com/${embed.userID}/videos/${embed.videoID}/`;

    case EmbedType.InstagramPost:
      return `https://www.instagram.com/p/${embed.postID}/`;

    case EmbedType.TwitterTweet:
      return `https://twitter.com/${embed.userID}/status/${embed.tweetID}/`;

    case EmbedType.VimeoVideo:
      return `https://vimeo.com/${embed.videoID}`;

    case EmbedType.YouTubeVideo:
      return `https://www.youtube.com/watch?v=${embed.videoID}`;

    case EmbedType.SoundCloudTrack:
      return `https://api.soundcloud.com/tracks/${embed.trackID}`;

    case EmbedType.PolisConversation:
      return `https://pol.is/${embed.conversationID}`;

    case EmbedType.TikTokVideo:
      return `https://www.tiktok.com/@${embed.userID}/video/${embed.videoID}`;

    case EmbedType.BildwurfAd:
      return `<div id="bildwurf-injection-wrapper"><ins className="aso-zone" data-zone="${embed.zoneID}"></ins></div>`;

    case EmbedType.StreamableVideo:
      return `https://streamable.com/${embed.videoID}`;

    case EmbedType.Other: {
      const hasTitle = !!embed.title;
      const hasHeight = !!embed.height;
      const hasWidth = !!embed.width;
      const hasStyles = !!embed.styleCustom;
      const hasSandbox = !!embed.sandbox;
      return embed.url ?
          `<iframe src="${embed.url}"${hasTitle ? ` title="${embed.title}"` : ''}${
            hasWidth ? ` width="${embed.width}"` : ''
          }${hasHeight ? ` height="${embed.height}"` : ''}${
            hasStyles ? ` style="${embed.styleCustom}"` : ''
          }${hasSandbox ? ` sandbox="${embed.sandbox}"` : ''}></iframe>`
        : '';
    }
  }
}
