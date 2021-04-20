import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
  useMemo,
  useRef
} from 'react'
import {useScript} from '../../utility'

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

export interface FacebookPostEmbedProps {
  userID: string
  postID: string
}

export function FacebookPostEmbed({userID, postID}: FacebookPostEmbedProps) {
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

  const encodedUserID = encodeURIComponent(userID)
  const encodedPostID = encodeURIComponent(postID)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 300,
        padding: 20
      }}
      ref={wrapperRef}>
      <div
        className="fb-post"
        data-href={`https://www.facebook.com/${encodedUserID}/posts/${encodedPostID}/`}
        data-show-text="true"
        data-width="200"
      />
    </div>
  )
}

export interface FacebookVideoEmbedProps {
  userID: string
  videoID: string
}

export function FacebookVideoEmbed({userID, videoID}: FacebookVideoEmbedProps) {
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

  const encodedUserID = encodeURIComponent(userID)
  const encodedVideoID = encodeURIComponent(videoID)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 300,
        padding: 20
      }}
      ref={wrapperRef}>
      <div
        className="fb-video"
        data-href={`https://www.facebook.com/${encodedUserID}/videos/${encodedVideoID}/`}
        data-show-text="true"
      />
    </div>
  )
}
