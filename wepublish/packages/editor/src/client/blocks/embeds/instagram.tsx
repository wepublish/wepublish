import React, {createContext, useContext, useEffect, ReactNode} from 'react'
import {useScript} from '../../utility'

// Define some globals set by the SDKs.
declare global {
  interface Window {
    instgrm: any
  }
}

export interface InstagramContextState {
  readonly isLoaded: boolean
  readonly isLoading: boolean

  load(): void
}

export const InstagramContext = createContext(null as InstagramContextState | null)

export interface InstagramProviderProps {
  children?: ReactNode
}

export function InstagramProvider({children}: InstagramProviderProps) {
  const contextValue = useScript('//www.instagram.com/embed.js', () => window.instgrm != null)
  return <InstagramContext.Provider value={contextValue}>{children}</InstagramContext.Provider>
}

export interface InstagramPostEmbedProps {
  postID: string
}

export function InstagramPostEmbed({postID}: InstagramPostEmbedProps) {
  const context = useContext(InstagramContext)

  if (!context) {
    throw new Error(
      `Coulnd't find InstagramContext, did you include InstagramProvider in the component tree?`
    )
  }

  const {isLoaded, isLoading, load} = context

  useEffect(() => {
    if (isLoaded) {
      window.instgrm.Embeds.process()
    } else if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 300,
        padding: 20
      }}>
      <blockquote
        className="instagram-media"
        data-width="100%"
        data-instgrm-captioned
        data-instgrm-permalink={`https://www.instagram.com/p/${encodeURIComponent(postID)}/`}
        data-instgrm-version="12"
      />
    </div>
  )
}
