import {Link as BuilderLink} from '@wepublish/ui'
import {BuilderLinkProps} from '@wepublish/website'
import NextLink from 'next/link'

export const NextWepublishLink = ({children, href, ...props}: BuilderLinkProps) => {
  return (
    <NextLink href={href ?? ''} as={href ?? ''} passHref legacyBehavior>
      <BuilderLink {...props}>{children}</BuilderLink>
    </NextLink>
  )
}
