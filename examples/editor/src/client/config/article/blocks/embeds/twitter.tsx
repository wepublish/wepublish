import React, {createContext, useContext, useEffect, ReactNode, useRef} from 'react'

import {useScript} from '../../utility'

// Define some globals set by the Twitter SDK.
declare global {
  interface Window {
    twttr: any
  }
}
export interface TwitterContextState {
  readonly isLoaded: boolean
  readonly isLoading: boolean

  load(): void
}

export const TwitterContext = createContext(null as TwitterContextState | null)

export interface TwitterProviderProps {
  children?: ReactNode
}

export function TwitterProvider({children}: TwitterProviderProps) {
  const contextValue = useScript(
    'https://platform.twitter.com/widgets.js',
    () => window.twttr != null
  )
  return <TwitterContext.Provider value={contextValue}>{children}</TwitterContext.Provider>
}

export interface TwitterTweetEmbedProps {
  userID: string
  tweetID: string
}

export function TwitterTweetEmbed({userID, tweetID}: TwitterTweetEmbedProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const context = useContext(TwitterContext)

  if (!context) {
    throw new Error(
      `Coulnd't find TwitterContext, did you include TwitterProvider in the component tree?`
    )
  }

  const {isLoaded, isLoading, load} = context

  useEffect(() => {
    if (isLoaded) {
      window.twttr.widgets.load(wrapperRef.current)
    } else if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  return (
    <div
      ref={wrapperRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 300,
        padding: 20
      }}>
      <blockquote className="twitter-tweet">
        <a
          href={`https://twitter.com/${encodeURIComponent(userID)}/status/${encodeURIComponent(
            tweetID
          )}`}
        />
      </blockquote>
    </div>
  )
}
