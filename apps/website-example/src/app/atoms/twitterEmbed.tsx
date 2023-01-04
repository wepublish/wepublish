import React, {useEffect, useRef, createContext, ReactNode, useContext} from 'react'
import {TwitterTweetEmbedData} from '../types'

import {useScript} from '../utility'
import {cssRule, useStyle} from '@karma.run/react'
import {pxToRem, whenMobile} from '../style/helpers'
import {Color} from '../style/colors'

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

/*
 *
 * Tweet Embed
 */
const TweetContainerStyle = cssRule(isLoaded => ({
  minWidth: pxToRem(520),
  backgroundColor: isLoaded ? 'transparent' : Color.NeutralLight,

  ...whenMobile({
    minWidth: pxToRem(320)
  })
}))

export function TwitterTweetEmbed({userID, tweetID}: TwitterTweetEmbedData) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const context = useContext(TwitterContext)

  if (!context) {
    throw new Error(
      `Coulnd't find TwitterContext, did you include TwitterProvider in the component tree?`
    )
  }

  const {isLoaded, isLoading, load} = context
  const css = useStyle(isLoaded)

  useEffect(() => {
    if (isLoaded) {
      window.twttr.widgets.load(wrapperRef.current)
    } else if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  return (
    <div className={css(TweetContainerStyle)} ref={wrapperRef}>
      <blockquote className="twitter-tweet" data-width="100%">
        <a
          href={`https://twitter.com/${encodeURIComponent(userID)}/status/${encodeURIComponent(
            tweetID
          )}`}
        />
      </blockquote>
    </div>
  )
}
