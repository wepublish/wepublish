import React, {useRef, useEffect, useState, useLayoutEffect} from 'react'

import {FullscreenOverlayWrapper} from '../atoms/fullscreenOverlayWrapper'
import {IconType, BlockIcon} from '../atoms/icon'
import {cssRule, useStyle} from '@karma.run/react'
import {ZIndex, desktopMediaQuery, pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {BaseButton} from '../atoms/baseButton'
import {Color} from '../style/colors'
import {ImageData} from '../types'
import {usePermanentVisibility} from '../utils/hooks'

interface GalleryStyleProps {
  readonly isFullscreen: boolean
  readonly showBackground: boolean
}

const previewPeekPercentage = 0.1

const StaticGalleryStyle = cssRule(() => ({
  '& img': {
    display: 'none'
  }
}))

const GalleryWrapperStyle = cssRule<GalleryStyleProps>(({isFullscreen, showBackground}) => ({
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  ...(isFullscreen
    ? {
        width: '100%',
        height: '100%'
      }
    : {})
}))

const GalleryContainerStyle = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  padding: `0 ${pxToRem(15)}`,
  marginBottom: pxToRem(50),
  backgroundColor: isFullscreen ? Color.Black : Color.White,

  ...(isFullscreen
    ? {
        position: 'relative',
        width: '100%',
        height: '100%'
      }
    : {}),

  ...whenTablet({
    padding: 0
  }),

  ...whenDesktop({
    padding: 0
  })
}))

const GalleryImageWrapperStyle = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  ...whenTablet({
    width: isFullscreen ? '100%' : '75%',
    position: 'absolute',
    left: '50%',
    transform: 'translate3d(-50%,0,0)',
    height: '100%',
    zIndex: 1
  }),

  ...whenDesktop({
    width: isFullscreen ? '100%' : '75%',
    position: 'absolute',
    left: '50%',
    transform: 'translate3d(-50%,0,0)',
    height: '100%',
    zIndex: 1
  })
}))

const GalleryCaptionContainerStyle = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  margin: '0 auto',
  backgroundColor: Color.White,
  position: 'relative',

  ...(isFullscreen
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        pointerEvents: 'none'
      }
    : {}),

  ...whenTablet({
    zIndex: 2,
    marginTop: isFullscreen ? 0 : pxToRem(15),

    ...(isFullscreen
      ? {
          height: pxToRem(60),
          top: 'auto',
          bottom: 0,
          width: '50%',
          left: '50%',
          transform: 'translate3d(-50%,0,0)'
        }
      : {})
  }),

  ...whenDesktop({
    zIndex: 2,
    marginTop: isFullscreen ? 0 : pxToRem(15),

    ...(isFullscreen
      ? {
          height: pxToRem(60),
          top: 'auto',
          bottom: 0,
          width: '50%',
          left: '50%',
          transform: 'translate3d(-50%,0,0)'
        }
      : {})
  })
}))

const GalleryCaptionStyle = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  fontSize: pxToRem(14),
  textAlign: 'center',
  padding: `${pxToRem(10)} 0`,
  pointerEvents: 'auto',

  ...(isFullscreen
    ? {
        padding: `${pxToRem(10)} ${pxToRem(25)}`,
        backgroundColor: Color.White,
        position: 'absolute',
        bottom: 0,
        width: '100%'
      }
    : {}),

  ...whenTablet({
    padding: `${pxToRem(22)} ${pxToRem(60)}`,
    fontSize: pxToRem(12)
  }),

  ...whenDesktop({
    padding: `${pxToRem(22)} ${pxToRem(60)}`,
    fontSize: pxToRem(12)
  })
}))

const GalleryNavigationButtonStyle = cssRule<GalleryStyleProps>(() => ({
  position: 'absolute',
  top: '50%',
  left: 0,
  transform: 'translate3d(0,-50%,0)',

  zIndex: ZIndex.Overlay,
  backgroundColor: Color.White,
  fontSize: pxToRem(32),
  opacity: 1,
  transition: 'opacity 50ms ease-in',

  ':disabled': {
    opacity: 0
  },

  ':last-of-type': {
    right: 0,
    left: 'auto'
  },

  ...whenTablet({
    width: pxToRem(60),
    height: pxToRem(60),
    border: `1px solid ${Color.Secondary}`,
    transition: 'border-color 200ms ease',

    ':hover': {
      borderColor: Color.PrimaryDark
    },

    '> div > svg': {
      width: pxToRem(58),
      height: pxToRem(58)
    }
  }),

  ...whenDesktop({
    width: pxToRem(60),
    height: pxToRem(60),
    border: `1px solid ${Color.Secondary}`,
    transition: 'border-color 200ms ease',

    ':hover': {
      borderColor: Color.PrimaryDark
    },

    '> div > svg': {
      width: pxToRem(58),
      height: pxToRem(58)
    }
  })
}))

const GalleryFullscreenButtonStyle = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  width: pxToRem(30),
  height: pxToRem(30),
  backgroundColor: Color.White,
  position: 'absolute',
  right: 0,
  top: isFullscreen ? 0 : '-30px',
  cursor: 'pointer',
  pointerEvents: 'auto',

  '> div > svg': {
    width: pxToRem(30),
    height: pxToRem(30)
  },

  ...(isFullscreen
    ? {
        width: pxToRem(60),
        height: pxToRem(60),

        '> div > svg': {
          width: pxToRem(60),
          height: pxToRem(60)
        }
      }
    : {}),

  ...whenTablet({
    top: 0,
    width: pxToRem(60),
    height: pxToRem(60),

    '> div > svg': {
      width: pxToRem(60),
      height: pxToRem(60)
    }
  }),

  ...whenDesktop({
    top: 0,
    width: pxToRem(60),
    height: pxToRem(60),

    '> div > svg': {
      width: pxToRem(60),
      height: pxToRem(60)
    }
  })
}))

const GalleryPageNumStyle = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  padding: isFullscreen ? pxToRem(23) : pxToRem(8),
  backgroundColor: Color.White,
  position: 'absolute',
  fontSize: pxToRem(10),
  top: isFullscreen ? 0 : '-30px',
  width: isFullscreen ? '100%' : 'auto',
  pointerEvents: 'auto',

  ...whenTablet({
    fontSize: pxToRem(14),
    top: 0,
    padding: pxToRem(21),

    ...(isFullscreen
      ? {
          backgroundColor: 'transparent',
          zIndex: 1,
          width: 'auto'
        }
      : {})
  }),

  ...whenDesktop({
    fontSize: pxToRem(14),
    top: 0,
    padding: pxToRem(21),

    ...(isFullscreen
      ? {
          backgroundColor: 'transparent',
          zIndex: 1,
          width: 'auto'
        }
      : {})
  })
}))

const GalleryScrollContainer = cssRule<GalleryStyleProps>(({isFullscreen}) => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden'
}))

const GalleryScrollWrapperStyle = cssRule<GalleryStyleProps>(() => ({
  position: 'relative',
  height: '100%'
}))

interface GalleryImageStyleProps {
  readonly isFullscreen: boolean
}

const GalleryImageStyle = cssRule<GalleryImageStyleProps>(({isFullscreen}) => ({
  position: 'absolute',
  margin: '0 15px',

  top: 0,
  left: 0,

  objectFit: isFullscreen ? 'contain' : 'cover'
}))

export interface GalleryProps {
  maxImageWidth: number
  aspectRatio: number

  currentIndex: number
  media: ImageData[]

  fullscreen?: boolean
  loop?: boolean

  onFullscreenToggle(): void
  onIndexChange(delta: number): void
}

export function Gallery(props: GalleryProps) {
  const [interactive, setInteractive] = useState(false)

  useEffect(() => {
    setInteractive(true)
  }, [])

  return interactive ? <InteractiveGallery {...props} /> : <StaticGallery {...props} />
}

export function StaticGallery({maxImageWidth, aspectRatio, media}: GalleryProps) {
  const css = useStyle()

  const imageHeight = maxImageWidth / aspectRatio

  // TODO: Better SSR
  return (
    <div className={css(StaticGalleryStyle)} style={{height: `${imageHeight}px`}}>
      {media.map(media => (
        <img key={media.url} src={media.url} />
      ))}
    </div>
  )
}

export function InteractiveGallery({
  aspectRatio,
  maxImageWidth,
  media,
  currentIndex,
  fullscreen: isFullscreen = false,
  loop: isLooping = false,
  onFullscreenToggle,
  onIndexChange
}: GalleryProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const cssProps: GalleryStyleProps = {isFullscreen, showBackground: show}
  const css = useStyle(cssProps)

  const containerRef = useRef<HTMLDivElement>(null)

  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const [isAnimating, setAnimating] = useState(false)
  const [isDesktop, setDesktop] = useState(false)

  const numMedia = media.length
  const currentMedia = media[currentIndex]

  const imageWidth = isFullscreen
    ? containerWidth
    : containerWidth > maxImageWidth
    ? maxImageWidth
    : containerWidth

  const imageHeight = isFullscreen ? containerHeight : imageWidth / aspectRatio

  function changeIndex(delta: number) {
    let newIndex = currentIndex + delta

    if (isLooping) {
      if (newIndex >= numMedia) {
        newIndex = 0
      }

      if (newIndex < 0) {
        newIndex = numMedia - 1
      }

      onIndexChange(newIndex)
    } else {
      if (newIndex >= 0 && newIndex < numMedia) {
        onIndexChange(newIndex)
      }
    }
  }

  useLayoutEffect(() => {
    setAnimating(true)
  }, [currentIndex])

  useLayoutEffect(() => {
    setContainerWidth(containerRef.current!.clientWidth)
    setContainerHeight(containerRef.current!.clientHeight)

    setAnimating(false)
    setDesktop(window.matchMedia(desktopMediaQuery).matches)
  }, [isFullscreen])

  useEffect(() => {
    function resizeCallback() {
      setContainerWidth(containerRef.current!.clientWidth)
      setContainerHeight(containerRef.current!.clientHeight)

      setAnimating(false)
    }

    function mediaQueryCallback(e: MediaQueryListEvent) {
      setDesktop(e.matches)
    }

    const mediaQuery = window.matchMedia(desktopMediaQuery)

    window.addEventListener('resize', resizeCallback)
    mediaQuery.addEventListener
      ? mediaQuery.addEventListener('change', mediaQueryCallback)
      : mediaQuery.addListener(mediaQueryCallback)

    return () => {
      window.removeEventListener('resize', resizeCallback)
      mediaQuery.removeEventListener
        ? mediaQuery.removeEventListener('change', mediaQueryCallback)
        : mediaQuery.removeListener(mediaQueryCallback)
    }
  }, [])

  return (
    <FullscreenOverlayWrapper isFullscreen={isFullscreen}>
      <div ref={ref} className={css(GalleryWrapperStyle)}>
        <div ref={containerRef} className={css(GalleryContainerStyle)}>
          <div
            className={css(GalleryScrollContainer)}
            style={{height: isFullscreen ? '100%' : `${imageHeight}px`}}>
            <div className={css(GalleryImageWrapperStyle)}>
              <BaseButton
                css={GalleryNavigationButtonStyle}
                cssProps={cssProps}
                onClick={() => changeIndex(-1)}
                disabled={!isLooping && currentIndex === 0}>
                <BlockIcon type={IconType.Previous} />
              </BaseButton>

              <BaseButton
                css={GalleryNavigationButtonStyle}
                cssProps={cssProps}
                onClick={() => changeIndex(+1)}
                disabled={!isLooping && currentIndex === media.length - 1}>
                <BlockIcon type={IconType.Next} />
              </BaseButton>
            </div>
            <div
              className={css(GalleryScrollWrapperStyle)}
              style={{
                transform: scrollTransformForIndex(
                  currentIndex,
                  imageWidth,
                  containerWidth,
                  isDesktop,
                  isFullscreen
                ),

                transitionProperty: 'transform',
                transitionTimingFunction: 'ease-in',
                transitionDuration: isAnimating ? '200ms' : '0ms'
              }}>
              {media.map((media, index) => (
                <GalleryImage
                  key={media.url}
                  index={index}
                  width={imageWidth}
                  height={imageHeight}
                  containerWidth={containerWidth}
                  fullscreen={isFullscreen}
                  desktop={isDesktop}
                  media={media}
                />
              ))}
            </div>
          </div>
          <div
            className={css(GalleryCaptionContainerStyle)}
            style={{maxWidth: isFullscreen ? undefined : imageWidth}}>
            <div className={css(GalleryPageNumStyle)}>
              {currentIndex + 1}/{numMedia}
            </div>
            <div className={css(GalleryCaptionStyle)}>{currentMedia.caption}</div>
            <BaseButton
              css={GalleryFullscreenButtonStyle}
              cssProps={cssProps}
              onClick={() => onFullscreenToggle()}>
              <BlockIcon type={isFullscreen ? IconType.Minimize : IconType.Maximize} />
            </BaseButton>
          </div>
        </div>
      </div>
    </FullscreenOverlayWrapper>
  )
}

interface GalleryImageProps {
  index: number
  width: number
  height: number
  containerWidth: number
  desktop: boolean
  fullscreen: boolean
  media: ImageData
}

function GalleryImage({
  index,
  width,
  height,
  containerWidth,
  desktop: isDesktop,
  fullscreen: isFullscreen,
  media
}: GalleryImageProps) {
  const css = useStyle({isFullscreen})

  return (
    <img
      key={media.url}
      className={css(GalleryImageStyle)}
      src={media.url}
      style={{
        transform: imageTransformForIndex(index, width, containerWidth, isDesktop, isFullscreen),
        width,
        height
      }}
    />
  )
}

function imageTransformForIndex(
  index: number,
  imageWidth: number,
  containerWidth: number,
  isDesktop: boolean,
  isFullscreen: boolean
) {
  return `translate(${imageTranslationForIndex(
    index,
    imageWidth,
    containerWidth,
    isDesktop,
    isFullscreen
  )}px)`
}

function scrollTransformForIndex(
  index: number,
  imageWidth: number,
  containerWidth: number,
  isDesktop: boolean,
  isFullscreen: boolean
) {
  return `translate(${scrollTranslationForIndex(
    index,
    imageWidth,
    containerWidth,
    isDesktop,
    isFullscreen
  )}px)`
}

function imageTranslationForIndex(
  index: number,
  imageWidth: number,
  containerWidth: number,
  isDesktop: boolean,
  isFullscreen: boolean
) {
  return isDesktop && !isFullscreen
    ? index * (containerWidth / 2 + imageWidth * (0.5 - previewPeekPercentage))
    : index * imageWidth
}

function scrollTranslationForIndex(
  index: number,
  imageWidth: number,
  containerWidth: number,
  isDesktop: boolean,
  isFullscreen: boolean
) {
  return (
    -imageTranslationForIndex(index, imageWidth, containerWidth, isDesktop, isFullscreen) +
    containerWidth / 2 -
    imageWidth / 2
  )
}
