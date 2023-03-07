import {Typography} from '@mui/material'
import {forwardRef, HTMLAttributes} from 'react'

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {component?: React.ElementType}

export const H1 = forwardRef(({children, ...props}: HeadingProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="h1">
      {children}
    </Typography>
  )
})

export const H2 = forwardRef(({children, ...props}: HeadingProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="h2">
      {children}
    </Typography>
  )
})

export const H3 = forwardRef(({children, ...props}: HeadingProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="h3">
      {children}
    </Typography>
  )
})

export const H4 = forwardRef(({children, ...props}: HeadingProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="h4">
      {children}
    </Typography>
  )
})

export const H5 = forwardRef(({children, ...props}: HeadingProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="h5">
      {children}
    </Typography>
  )
})

export const H6 = forwardRef(({children, ...props}: HeadingProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="h6">
      {children}
    </Typography>
  )
})

export type ParagraphProps = HTMLAttributes<HTMLParagraphElement> & {component?: React.ElementType}

export const Paragraph = forwardRef(({children, ...props}: ParagraphProps, ref) => {
  return (
    <Typography {...props} ref={ref as any} variant="body1">
      {children}
    </Typography>
  )
})
