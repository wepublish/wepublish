import {Link as BuilderLink} from '@wepublish/ui'
import {BuilderLinkProps} from '@wepublish/website-builder'
import NextLink from 'next/link'

export const Link = ({children, href, ...props}: BuilderLinkProps) => {
  const hrefWithoutOrigin =
    (typeof window !== 'undefined' ? href?.replace(location.origin, '') : href) ?? ''

  return (
    <NextLink href={hrefWithoutOrigin} as={hrefWithoutOrigin} passHref legacyBehavior>
      <BuilderLink {...props}>{children}</BuilderLink>
    </NextLink>
  )
}
