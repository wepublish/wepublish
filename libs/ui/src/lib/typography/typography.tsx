import {css, Link as MuiLink, LinkTypeMap, Typography, useTheme} from '@mui/material'
import styled from '@emotion/styled'
import {AnchorHTMLAttributes, forwardRef, HTMLAttributes, useMemo} from 'react'

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  component?: React.ElementType
  gutterBottom?: boolean
}

export const H1 = forwardRef<HTMLHeadingElement, HeadingProps>(({children, ...props}, ref) => {
  return (
    <Typography {...props} ref={ref} variant="h1">
      {children}
    </Typography>
  )
})

export const H2 = forwardRef<HTMLHeadingElement, HeadingProps>(({children, ...props}, ref) => {
  return (
    <Typography {...props} ref={ref} variant="h2">
      {children}
    </Typography>
  )
})

export const H3 = forwardRef<HTMLHeadingElement, HeadingProps>(({children, ...props}, ref) => {
  return (
    <Typography {...props} ref={ref} variant="h3">
      {children}
    </Typography>
  )
})

export const H4 = forwardRef<HTMLHeadingElement, HeadingProps>(({children, ...props}, ref) => {
  return (
    <Typography {...props} ref={ref} variant="h4">
      {children}
    </Typography>
  )
})

export const H5 = forwardRef<HTMLHeadingElement, HeadingProps>(({children, ...props}, ref) => {
  return (
    <Typography {...props} ref={ref} variant="h5">
      {children}
    </Typography>
  )
})

export const H6 = forwardRef<HTMLHeadingElement, HeadingProps>(({children, ...props}, ref) => {
  return (
    <Typography {...props} ref={ref} variant="h6">
      {children}
    </Typography>
  )
})

export type ParagraphProps = HTMLAttributes<HTMLParagraphElement> & {
  component?: React.ElementType
  gutterBottom?: boolean
}

const useGutterStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      &.MuiTypography-gutterBottom {
        margin-bottom: ${theme.spacing(3)};
      }
    `,
    [theme]
  )
}

export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({children, gutterBottom = true, ...props}, ref) => {
    const gutterStyles = useGutterStyles()

    return (
      <Typography
        {...props}
        ref={ref}
        variant="body1"
        gutterBottom={gutterBottom}
        css={gutterStyles}>
        {children}
      </Typography>
    )
  }
)

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  component?: React.ElementType
  underline?: LinkTypeMap['props']['underline']
  color?: LinkTypeMap['props']['color']
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({children, underline, color, ...props}, ref) => {
    return (
      <MuiLink {...props} ref={ref} color={color} underline={underline}>
        {children}
      </MuiLink>
    )
  }
)
