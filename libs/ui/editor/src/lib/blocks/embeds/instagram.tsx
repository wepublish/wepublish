import styled from '@emotion/styled';
import { createContext, ReactNode, useContext, useEffect } from 'react';

import { useScript } from '../../utility';

const InstagramEmbed = styled.div`
  display: flex;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
`;

// Define some globals set by the SDKs.
declare global {
  interface Window {
    instgrm?: any;
  }
}

export interface InstagramContextState {
  readonly isLoaded: boolean;
  readonly isLoading: boolean;

  load(): void;
}

export const InstagramContext = createContext(
  null as InstagramContextState | null
);

export interface InstagramProviderProps {
  children?: ReactNode;
}

export function InstagramProvider({ children }: InstagramProviderProps) {
  const contextValue = useScript(
    '//www.instagram.com/embed.js',
    () => window.instgrm != null
  );
  return (
    <InstagramContext.Provider value={contextValue}>
      {children}
    </InstagramContext.Provider>
  );
}

export interface InstagramPostEmbedProps {
  postID: string | null | undefined;
}

export function InstagramPostEmbed({ postID }: InstagramPostEmbedProps) {
  const context = useContext(InstagramContext);

  if (!context) {
    throw new Error(
      `Coulnd't find InstagramContext, did you include InstagramProvider in the component tree?`
    );
  }

  const { isLoaded, isLoading, load } = context;

  useEffect(() => {
    if (isLoaded) {
      window.instgrm.Embeds.process();
    } else if (!isLoading) {
      load();
    }
  }, [isLoaded, isLoading]);

  return (
    <InstagramEmbed>
      {postID && (
        <blockquote
          className="instagram-media"
          data-width="100%"
          data-instgrm-captioned
          data-instgrm-permalink={`https://www.instagram.com/p/${encodeURIComponent(postID)}/`}
          data-instgrm-version="12"
        />
      )}
    </InstagramEmbed>
  );
}
