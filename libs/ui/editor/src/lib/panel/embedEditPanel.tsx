import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Drawer, Input as RInput, Message } from 'rsuite';

import { EmbedPreview } from '../blocks/embedBlock';
import { EmbedBlockValue, EmbedType } from '../blocks/types';
import { flattenDOMTokenList } from '../utility';

const Metadata = styled.div`
  margin-bottom: 8px;
`;

const Input = styled(RInput)`
  width: 100%;
`;

export interface EmbedEditPanel {
  readonly value: EmbedBlockValue;
  onClose(): void;
  onConfirm(value: EmbedBlockValue): void;
}

export function EmbedEditPanel({ value, onClose, onConfirm }: EmbedEditPanel) {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [input, setInput] = useState(() =>
    deriveInputFromEmbedBlockValue(value)
  );
  const [embed, setEmbed] = useState<EmbedBlockValue>(value);
  const isEmpty = embed.type === EmbedType.Other && embed.url === undefined;
  const { t } = useTranslation();

  useEffect(() => {
    setErrorMessage(undefined);

    const facebookPostMatch = input.match(
      /facebook.com\/(.+)\/posts\/([0-9]+)/
    );
    const facebookVideoMatch = input.match(
      /facebook.com\/(.+)\/videos\/([0-9]+)/
    );
    const instagramMatch = input.match(/instagram.com\/p\/([0-9a-zA-Z-_]+)/);
    const twitterMatch = input.match(
      /twitter.com\/([0-9a-zA-Z-_]+)\/status\/([0-9]+)/
    );
    const vimeoMatch = input.match(/vimeo.com\/([0-9]+)/);
    const youTubeMatch = input.match(/youtube.com\/watch\?v=([0-9a-zA-Z-_]+)/);
    const polisMatch = input.match(/pol.is\/([0-9a-zA-Z-_]+)/);
    const tikTokMatch = input.match(
      /tiktok\.com\/@([0-9a-zA-Z-_.]+)\/video\/([0-9]+)/
    );
    const bildwurfAdMatch = input.match(/data-zone="([0-9a-zA-Z-_]+)"/);

    const streamableVideoMatch = input.match(
      /nostreamable\.com\/(?:e\/)?([0-9a-zA-Z-_]+)/
    );

    if (facebookPostMatch) {
      const [, userID, postID] = facebookPostMatch;
      setEmbed({ type: EmbedType.FacebookPost, userID, postID });
    } else if (facebookVideoMatch) {
      const [, userID, videoID] = facebookVideoMatch;
      setEmbed({ type: EmbedType.FacebookVideo, userID, videoID });
    } else if (instagramMatch) {
      const [, postID] = instagramMatch;
      setEmbed({ type: EmbedType.InstagramPost, postID });
    } else if (twitterMatch) {
      const [, userID, tweetID] = twitterMatch;
      setEmbed({ type: EmbedType.TwitterTweet, userID, tweetID });
    } else if (vimeoMatch) {
      const [, videoID] = vimeoMatch;
      setEmbed({ type: EmbedType.VimeoVideo, videoID });
    } else if (youTubeMatch) {
      const [, videoID] = youTubeMatch;
      setEmbed({ type: EmbedType.YouTubeVideo, videoID });
    } else if (polisMatch) {
      const [, conversationID] = polisMatch;
      setEmbed({ type: EmbedType.PolisConversation, conversationID });
    } else if (tikTokMatch) {
      const [, userID, videoID] = tikTokMatch;
      setEmbed({ type: EmbedType.TikTokVideo, userID, videoID });
    } else if (bildwurfAdMatch) {
      const [, zoneID] = bildwurfAdMatch;
      setEmbed({ type: EmbedType.BildwurfAd, zoneID });
    } else if (streamableVideoMatch) {
      const [, videoID] = streamableVideoMatch;
      setEmbed({ type: EmbedType.StreamableVideo, videoID });
    } else {
      if (input) {
        const parser = new DOMParser();
        const element = parser.parseFromString(input, 'text/html');
        const iframe = element.getElementsByTagName('iframe')[0];

        if (iframe) {
          const soundCloudMatch = iframe.src.match(
            /api.soundcloud.com\/tracks\/([0-9]+)/
          );
          if (soundCloudMatch) {
            const [, trackID] = soundCloudMatch;
            setEmbed({ type: EmbedType.SoundCloudTrack, trackID });
          } else {
            // add iframe attributes if set in input
            const setEmbedOther = {
              title: iframe.title,
              width: iframe.width ? parseInt(iframe.width) : undefined,
              height: iframe.height ? parseInt(iframe.height) : undefined,
              styleCustom:
                !!iframe.style && !!iframe.style.cssText ?
                  iframe.style.cssText
                : '',
              sandbox:
                iframe.sandbox ?
                  flattenDOMTokenList(iframe.sandbox)
                : undefined,
            };

            setEmbed({
              type: EmbedType.Other,
              url: iframe.src,
              ...setEmbedOther,
            });
          }
        } else {
          try {
            setEmbed({ type: EmbedType.Other, url: new URL(input).toString() });
          } catch {
            setEmbed({ type: EmbedType.Other });
            setErrorMessage(t('blocks.embeds.panels.invalidURL'));
          }
        }
      } else {
        setEmbed({ type: EmbedType.Other });
      }
    }
  }, [input]);

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.embeds.panels.editEmbed')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance="primary"
            disabled={isEmpty}
            onClick={() => onConfirm(embed)}
          >
            {t('blocks.embeds.panels.confirm')}
          </Button>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('blocks.embeds.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Input
          as="textarea"
          rows={3}
          placeholder={t('blocks.embeds.panels.embed')}
          value={input}
          onChange={input => setInput(input)}
        />
        {errorMessage && <Message type="error">{errorMessage}</Message>}
        <Metadata>
          <p>{t('blocks.embeds.panels.socialMediaList')}</p>
          <code>{t('blocks.embeds.panels.fbPosts')}</code>
          <p>{t('blocks.embeds.panels.embedCodeAttributes')}</p>
          <code>{t('blocks.embeds.panels.iframe1Sample')}</code>
          <p>{t('blocks.embeds.panels.alternativeStyling')}</p>
          <code>{t('blocks.embeds.panels.iframe2Sample')}</code>
          <p>{t('blocks.embeds.panels.GDPRInfo')}</p>
        </Metadata>
        <EmbedPreview value={embed} />
      </Drawer.Body>
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
