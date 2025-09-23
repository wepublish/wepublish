import styled from '@emotion/styled';
import {
  BlockContent,
  InstagramPostBlock as InstagramPostBlockType,
} from '@wepublish/website/api';
import {
  BuilderInstagramPostBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useCallback, useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export const isInstagramBlock = (
  block: Pick<BlockContent, '__typename'>
): block is InstagramPostBlockType => block.__typename === 'InstagramPostBlock';

export const InstagramBlockWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

export function InstagramPostBlock({
  postID,
  className,
}: BuilderInstagramPostBlockProps) {
  const { Script } = useWebsiteBuilder();

  const loadAd = useCallback(() => {
    try {
      window.instgrm?.Embeds.process();
    } catch (error) {
      // do nothing
    }
  }, []);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  if (!postID) {
    return null;
  }

  return (
    <InstagramBlockWrapper className={className}>
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={`https://www.instagram.com/p/${encodeURIComponent(postID)}/`}
        data-instgrm-version="14"
      />

      <Script
        src="https://www.instagram.com/embed.js"
        async
        onLoad={loadAd}
      />
    </InstagramBlockWrapper>
  );
}
