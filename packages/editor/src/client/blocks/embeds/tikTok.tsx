import React, {createContext, useContext, useEffect, ReactNode} from 'react'
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
  videoID: string
  userID: string
}

export function TikTokVideoEmbed({videoID, userID}: TikTokVideoEmbedProps) {
  const context = useContext(TikTokContext)
  if (!context) {
    throw new Error(
      `Couldn't find TikTokContext, did you include TikTokProvider in the component tree?`
    )
  }

  const {isLoaded, isLoading, load} = context

  console.log(window.tiktokEmbed)

  useEffect(() => {
    console.log(window.tiktokEmbed)
    if (isLoaded) {
      // window.tiktokEmbed
    } else if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  useEffect(() => {
    fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${userID}/video/${videoID}&format=json`
      // `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@scout2015/video/6718335390845095173`
    ).then(data => console.log('data', data))
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 300,
        padding: 20
      }}>
      <blockquote
        className="tiktok-embed"
        cite={`https://www.tiktok.com/@${userID}/video/${videoID}`}
        data-video-id={videoID}
        style={{maxWidth: '605px', minWidth: '325px'}}>
        <section>
          <a
            target="_blank"
            rel="noreferrer"
            title={userID}
            href={`https://www.tiktok.com/@${userID}`}>
            @${userID}
          </a>
        </section>
      </blockquote>
    </div>
  )
}
