import {ForwardedRef, forwardRef, HTMLAttributes} from 'react'

export type UnorderedListProps = HTMLAttributes<HTMLUListElement> & {component?: React.ElementType}

export const UnorderedList = forwardRef(
  ({children, ...props}: UnorderedListProps, ref: ForwardedRef<HTMLUListElement>) => {
    return (
      <ul {...props} ref={ref}>
        {children}
      </ul>
    )
  }
)

export type OrderedListProps = HTMLAttributes<HTMLOListElement> & {component?: React.ElementType}

export const OrderedList = forwardRef(
  ({children, ...props}: OrderedListProps, ref: ForwardedRef<HTMLOListElement>) => {
    return (
      <ol {...props} ref={ref}>
        {children}
      </ol>
    )
  }
)

export type ListItemProps = HTMLAttributes<HTMLLIElement> & {component?: React.ElementType}

export const ListItem = forwardRef(
  ({children, ...props}: ListItemProps, ref: ForwardedRef<HTMLLIElement>) => {
    return (
      <li {...props} ref={ref}>
        {children}
      </li>
    )
  }
)
