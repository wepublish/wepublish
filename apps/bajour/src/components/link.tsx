import {Link as BuilderLink} from '@wepublish/ui'
import {BuilderLinkProps} from '@wepublish/website'
import NextLink from 'next/link'
import {forwardRef} from 'react'

export const Link = forwardRef<HTMLAnchorElement, BuilderLinkProps>(
  ({children, href, ...props}, ref) => {
    const hrefWithoutOrigin =
      (typeof window !== 'undefined' ? href?.replace(location.origin, '') : href) ?? ''

    return (
      <NextLink ref={ref} href={hrefWithoutOrigin} as={hrefWithoutOrigin} passHref legacyBehavior>
        <BuilderLink {...props}>{children}</BuilderLink>
      </NextLink>
    )
  }
)
