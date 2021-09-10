import React from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem} from '../style/helpers'

export interface RoundImageStyleStyleProps {
  width: number | undefined
  height: number | undefined
}

export const RoundImageStyle = cssRule(({width = 60, height = 60}: RoundImageStyleStyleProps) => ({
  display: 'block',
  width: pxToRem(width),
  height: pxToRem(height),
  objectFit: 'cover',
  backgroundColor: Color.NeutralDark,
  borderRadius: '100%'
}))

export interface RoundImageProps {
  readonly src: string
  readonly width?: number
  readonly height?: number
  readonly alt?: string
}

export function RoundImage({src, width, height, alt}: RoundImageProps) {
  const css = useStyle({width, height})
  return <img className={css(RoundImageStyle)} src={src} width={width} height={height} alt={alt} />
}
