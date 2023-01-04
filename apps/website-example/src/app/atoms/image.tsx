import React from 'react'
import {useStyle, cssRule} from '@karma.run/react'

export enum ImageFit {
  Contain = 'contain',
  Cover = 'cover'
}

export interface ImageStyleProps {
  fit: ImageFit
}

export const ImageStyle = cssRule(({fit}: ImageStyleProps) => ({
  width: '100%',
  display: 'block',
  objectFit: fit
}))

export interface ImageProps {
  readonly src: string
  readonly width?: number
  readonly height?: number
  readonly fit?: ImageFit
  readonly alt?: string
}

export function Image({src, width, height, fit, alt}: ImageProps) {
  const css = useStyle<ImageStyleProps>({
    fit: fit || ImageFit.Cover
  })

  return <img className={css(ImageStyle)} src={src} alt={alt} width={width} height={height} />
}
