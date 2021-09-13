import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  ReactNode,
  useContext,
  useMemo
} from 'react'

import {FacebookPostEmbedData} from '../types'

import {useScript} from '../utility'
import {cssRule, useStyle} from '@karma.run/react'
import {whenMobile} from '../style/helpers'

// Define some globals set by Facebook SDK.
declare global {
  interface Window {
    fbAsyncInit: any
    FB: any
  }
}

export interface FacebookContextState {
  readonly isLoaded: boolean
  readonly isLoading: boolean

  load(): void
}

export const FacebookContext = createContext(null as FacebookContextState | null)

export interface FacebookProviderProps {
  sdkLanguage: string
  children?: ReactNode
}

export function FacebookProvider({children, sdkLanguage}: FacebookProviderProps) {
  const {isLoading, load} = useScript(
    `https://connect.facebook.net/${encodeURIComponent(sdkLanguage)}/sdk.js#version=v4.0`,
    () => window.FB != null,
    true
  )

  const [isLoaded, setLoaded] = useState(false)

  const contextValue = useMemo(
    () => ({
      isLoading,
      isLoaded,
      load
    }),
    [isLoaded, isLoading, load]
  )

  useEffect(() => {
    if (window.FB) {
      window.FB.init({
        xfbml: false,
        version: 'v4.0'
      })

      setLoaded(true)
    } else {
      window.fbAsyncInit = () => {
        window.FB.init({
          xfbml: false,
          version: 'v4.0'
        })

        setLoaded(true)
      }
    }

    return () => {
      window.fbAsyncInit = null
    }
  }, [])

  return <FacebookContext.Provider value={contextValue}>{children}</FacebookContext.Provider>
}

/**
 *
 * Facebook Post Embed
 */

const FacebookPostStyle = cssRule(isLoaded => ({
  // TODO: could be better
  ...whenMobile({
    '&>div>span': {
      width: '100%!important'
    },
    '&>div>span>iframe': {
      width: '100%!important'
    }
  })
}))

export interface FacebookPostEmbedProps extends FacebookPostEmbedData {
  width?: number
}

export function FacebookPostEmbed({width = 570, userID, postID}: FacebookPostEmbedProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const context = useContext(FacebookContext)

  if (!context) {
    throw new Error(
      `Couldn't find FacebookContext, did you include FacebookProvider in the component tree?`
    )
  }

  const {isLoaded, isLoading, load} = context

  useEffect(() => {
    if (isLoaded) {
      window.FB.XFBML.parse(wrapperRef.current)
    } else if (!isLoading) {
      load()
    }
  }, [isLoaded, isLoading])

  const css = useStyle(isLoaded)

  return (
    <div ref={wrapperRef} className={css(FacebookPostStyle)}>
      <div
        className="fb-post"
        data-href={`https://www.facebook.com/${encodeURIComponent(
          userID
        )}/posts/${encodeURIComponent(postID)}/`}
        data-show-text="true"
      />
    </div>
  )
}
