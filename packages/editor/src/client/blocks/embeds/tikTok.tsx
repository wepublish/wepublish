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
  const [, /*tikTokVideoData*/ setTikTokVideoData] = useState<any>({})

  const tiktokData = async () => {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${userID}/video/${videoID}&format=json`
    )

    const data = await response.json()
    setTikTokVideoData(data)

    console.log('data', data)
  }

  const {isLoaded, isLoading, load} = context

  useEffect(() => {
    if (!isLoaded) {
      load()
    }
  }, [isLoaded, isLoading, videoID, userID])

  useEffect(() => {
    tiktokData()
    load()
  }, [userID, videoID])

  return (
    // <div
    //   dangerouslySetInnerHTML={{__html: htmlContent}}
    // style={{
    //   display: 'flex',
    //   justifyContent: 'center',
    //   minHeight: 300,
    //   padding: 20
    // }}>
    <blockquote
      className="tiktok-embed"
      cite={`https://www.tiktok.com/@${userID}/video/${videoID}`}
      data-video-id={videoID}
      style={{maxWidth: '605px', minWidth: '325px'}}>
      <section>
        <a target="_blank" rel="noreferrer" href={`https://www.tiktok.com/${userID}`}>
          @{userID}
        </a>
      </section>
    </blockquote>
  )
}

/*
<blockquote
class="tiktok-embed"
cite="https://www.tiktok.com/@ifluent/video/7062106915895037190"
data-video-id="7062106915895037190"
style="max-width: 605px;min-width: 325px;" >
<section>
 <a target="_blank" title="@ifluent"
 href="https://www.tiktok.com/@ifluent">@ifluent</a> Who will mess up this time?
 <a title="learninglanguages" target="_blank" href="https://www.tiktok.com/tag/learninglanguages">#learninglanguages</a>
 <a target="_blank" title="♬ original sound - iFluent"
 href="https://www.tiktok.com/music/original-sound-7062109132526357254">♬ original sound - iFluent</a>
 </section>
 </blockquote>
 */
