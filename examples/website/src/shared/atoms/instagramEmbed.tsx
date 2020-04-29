import React, {useEffect, createContext, ReactNode, useContext} from 'react'
import {InstagramPostEmbedData} from '../types'

import {useScript} from '../utility'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

// Define some globals set by Instagram SDK.
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

const InstaPostStyle = cssRule(isLoaded => ({
  backgroundColor: isLoaded ? 'transparent' : Color.NeutralLight,
  minWidth: pxToRem(320)
}))

export function InstagramPostEmbed({postID}: InstagramPostEmbedData) {
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

  const css = useStyle(isLoaded)

  return (
    <div className={css(InstaPostStyle)}>
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
