import React, {createContext, useContext, useEffect, ReactNode, useState} from 'react'
import {useScript} from '../../utility'

// Define some globals set by the SDKs.
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
  const contextValue = useScript(
    '//www.tiktok.com/embed.js',
    () => window.tiktokEmbed?.isEventsInit != null
  )
  return <TikTokContext.Provider value={contextValue}>{children}</TikTokContext.Provider>
}

export interface TikTokVideoEmbedProps {
  userID: string
  videoID: string
}

export function TikTokVideoEmbed({userID, videoID}: TikTokVideoEmbedProps) {
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
    // console.log(window.tiktokEmbed)
    if (isLoaded) {
      // window.tiktokEmbed
    } else if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  useEffect(() => {
    tiktokData()
  }, [])

  return (
    <div
      dangerouslySetInnerHTML={{__html: htmlContent}}
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 300,
        padding: 20
      }}
    />
  )
}
