import { Link as BuilderLink } from '@wepublish/ui';
import { BuilderLinkProps } from '@wepublish/website/builder';
import NextLink from 'next/link';
import { forwardRef } from 'react';

export const NextWepublishLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function NextWepublishLink({ children, href, variant, ...props }, ref) {
  return (
    <BuilderLink
      {...props}
      ref={ref}
      component={NextLink}
      href={href ?? ''}
      variant={variant}
    >
      {children}
    </BuilderLink>
  );
});
