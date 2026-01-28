import { Link as BuilderLink } from '@wepublish/ui';
import { BuilderLinkProps } from '@wepublish/website/builder';
import NextLink from 'next/link';
import { forwardRef } from 'react';

export const NextWepublishLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps
>(function NextWepublishLink({ children, href, ...props }, ref) {
  return (
    <BuilderLink
      {...props}
      ref={ref}
      component={NextLink}
      href={href ?? ''}
    >
      {children}
    </BuilderLink>
  );
});
