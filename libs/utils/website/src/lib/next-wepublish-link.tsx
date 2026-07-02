import { Link as BuilderLink } from '@wepublish/ui';
import { BuilderLinkProps, useLinkProps } from '@wepublish/website/builder';
import NextLink from 'next/link';
import { forwardRef } from 'react';

export const NextWepublishLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function NextWepublishLink({ children, href, variant, ...props }, ref) {
  const linkProps = useLinkProps(props);

  if (process.env.APP_ENVIRONMENT !== 'production') {
    linkProps.prefetch = false;
  }

  return (
    <BuilderLink
      {...linkProps}
      ref={ref}
      component={NextLink}
      href={href ?? ''}
      variant={variant}
    >
      {children}
    </BuilderLink>
  );
});
