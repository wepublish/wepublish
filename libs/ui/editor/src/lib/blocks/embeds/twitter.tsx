import styled from '@emotion/styled';
import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

import { useScript } from '../../utility';

const TwitterEmbed = styled.div`
  display: flex;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
`;

// Define some globals set by the Twitter SDK.
declare global {
  interface Window {
    twttr: any;
  }
}
export interface TwitterContextState {
  readonly isLoaded: boolean;
  readonly isLoading: boolean;

  load(): void;
}

export const TwitterContext = createContext(null as TwitterContextState | null);

export interface TwitterProviderProps {
  children?: ReactNode;
}

export function TwitterProvider({ children }: TwitterProviderProps) {
  const contextValue = useScript(
    'https://platform.twitter.com/widgets.js',
    () => window.twttr != null
  );
  return (
    <TwitterContext.Provider value={contextValue}>
      {children}
    </TwitterContext.Provider>
  );
}

export interface TwitterTweetEmbedProps {
  userID: string | null | undefined;
  tweetID: string | null | undefined;
}

export function TwitterTweetEmbed({ userID, tweetID }: TwitterTweetEmbedProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const context = useContext(TwitterContext);

  if (!context) {
    throw new Error(
      `Coulnd't find TwitterContext, did you include TwitterProvider in the component tree?`
    );
  }

  const { isLoaded, isLoading, load } = context;

  useEffect(() => {
    if (isLoaded) {
      window.twttr.widgets.load(wrapperRef.current);
    } else if (!isLoading) {
      load();
    }
  }, [isLoaded, isLoading]);

  return (
    <TwitterEmbed ref={wrapperRef}>
      {userID && tweetID && (
        <blockquote className="twitter-tweet">
          <a
            href={`https://twitter.com/${encodeURIComponent(userID)}/status/${encodeURIComponent(
              tweetID
            )}`}
          />
        </blockquote>
      )}
    </TwitterEmbed>
  );
}
