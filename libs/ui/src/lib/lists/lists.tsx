import {Typography} from '@mui/material'
import {ForwardedRef, forwardRef, HTMLAttributes} from 'react'

export type UnorderedListProps = HTMLAttributes<HTMLUListElement> & {component?: React.ElementType}

export const UnorderedList = forwardRef(
  ({children, ...props}: UnorderedListProps, ref: ForwardedRef<HTMLUListElement>) => {
    return (
      <Typography {...props} ref={ref} component="ul" variant="body1">
        {children}
      </Typography>
    )
  }
)

export type OrderedListProps = HTMLAttributes<HTMLOListElement> & {component?: React.ElementType}

export const OrderedList = forwardRef(
  ({children, ...props}: OrderedListProps, ref: ForwardedRef<HTMLOListElement>) => {
    return (
      <Typography {...props} ref={ref} component="ol" variant="body1">
        {children}
      </Typography>
    )
  }
)

export type ListItemProps = HTMLAttributes<HTMLLIElement> & {component?: React.ElementType} & {
  gutterBottom?: boolean
}

export const ListItem = forwardRef(
  ({children, gutterBottom = true, ...props}: ListItemProps, ref: ForwardedRef<HTMLLIElement>) => {
    return (
      <Typography {...props} ref={ref} component="li" variant="body1" gutterBottom={gutterBottom}>
        {children}
      </Typography>
    )
  }
)
