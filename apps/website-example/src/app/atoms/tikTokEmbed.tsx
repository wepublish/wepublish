import React, {useEffect, createContext, ReactNode, useContext} from 'react'
import {TikTokVideoEmbedData} from '../types'

import {useScript} from '../utility'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

// Define some globals set by Tiktok SDK.
declare global {
  interface Window {
    tiktokEmbed: any
  }
}

export const getTikTokBlock = (userID: string, vidID: string) => {
  return (
    <blockquote
      className="tiktok-embed"
      cite={`https://www.tiktok.com/@${userID}/video/${vidID}`}
      data-video-id={vidID}
      style={{maxWidth: '605px', minWidth: '325px'}}>
      <section>
        <a
          target="_blank"
          rel="noreferrer"
          title={`@${userID}`}
          href={`https://www.tiktok.com/@${userID}`}>
          @{userID}
        </a>
      </section>
    </blockquote>
  )
}

export interface TikTokContextState {
  readonly isLoaded: boolean
  readonly isLoading: boolean

  load(): void
}

export const TikTokContext = createContext(null as TikTokContextState | null)

export interface TikTokProviderProps {
  children?: ReactNode
}

export function TikTokProvider({children}: TikTokProviderProps) {
  const contextValue = useScript(
    '//www.tiktok.com/embed.js',
    () => window?.tiktokEmbed !== undefined
  )
  return <TikTokContext.Provider value={contextValue}>{children}</TikTokContext.Provider>
}

const TikTokVidStyle = cssRule(isLoaded => ({
  backgroundColor: isLoaded ? 'transparent' : Color.NeutralLight,
  minWidth: pxToRem(320)
}))

export function TikTokVideoEmbed({userID, videoID}: TikTokVideoEmbedData) {
  const context = useContext(TikTokContext)

  if (!context) {
    throw new Error(
      `Couldn't find TikTokContext, did you include TikTokProvider in the component tree?`
    )
  }

  const {isLoaded, isLoading, load} = context

  useEffect(() => {
    if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  const css = useStyle(isLoaded)

  return <div className={css(TikTokVidStyle)}>{getTikTokBlock(userID, videoID)}</div>
}
