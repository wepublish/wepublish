import React, {useEffect, createContext, ReactNode, useContext, useState} from 'react'
import {TikTokVideoEmbedData} from '../types'

import {useScript} from '../utility'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

// Define some globals set by Instagram SDK.
declare global {
  interface Window {
    tiktokEmbed: any
  }
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
  const contextValue = useScript('//www.tiktok.com/embed.js', () => window.instgrm != null)
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

  const [htmlContent, setHtmlContent] = useState('')

  const tiktokData = async () => {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${userID}/video/${videoID}&format=json`
    )
    const data = await response.json()
    setHtmlContent(data.html)
  }

  const {isLoaded, isLoading, load} = context

  useEffect(() => {
    if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  useEffect(() => {
    tiktokData()
  }, [userID, videoID])

  const css = useStyle(isLoaded)

  return (
    <div className={css(TikTokVidStyle)}>
      {/* <blockquote /> */}
      <p>dfsg</p>
    </div>
  )
}
