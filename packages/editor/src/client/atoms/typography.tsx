import {CSSProperties} from 'react'

export type TypographyVariant =
  | 'title'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body1'
  | 'body2'
  | 'subtitle1'
  | 'subtitle2'

export type TypographyTextAlign = 'left' | 'center' | 'right'
export type TypographyDisplay = 'block' | 'inline'
export type TypographySpacing = 'small' | 'large'

export function elementForTypographyVariant(variant: TypographyVariant) {
  switch (variant) {
    case 'title':
      return 'h1'

    case 'h1':
      return 'h1'

    case 'h2':
      return 'h2'

    case 'h3':
      return 'h3'

    default:
      return 'p'
  }
}

export function marginForTypographySpacing(spacing: TypographySpacing): string {
  switch (spacing) {
    case 'small':
      return '0.4em'

    case 'large':
      return '0.8em'
  }
}

export function stylesForTypographyVariant(style: TypographyVariant): CSSProperties {
  switch (style) {
    case 'title':
      return {
        fontSize: 40,
        fontWeight: 'bold'
      }

    case 'h1':
      return {
        fontSize: 28,
        fontWeight: 'bold'
      }

    case 'h2':
      return {
        fontSize: 24,
        fontWeight: 'bold'
      }

    case 'h3':
      return {
        fontSize: 20,
        fontWeight: 'bold'
      }

    case 'body1':
    case 'body2':
      return {
        fontSize: 16,
        fontWeight: style === 'body2' ? 'bold' : undefined
      }

    case 'subtitle1':
    case 'subtitle2':
      return {
        fontSize: 12,
        fontStyle: style === 'subtitle2' ? 'italic' : undefined
      }
  }
}
