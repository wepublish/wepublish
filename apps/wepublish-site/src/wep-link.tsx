import { NextWepublishLink } from '@wepublish/utils/website';
import { BuilderLinkProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

const locales = ['de', 'fr'];

export const WepLink = forwardRef<HTMLAnchorElement, BuilderLinkProps>(
  function WepLink({ href, ...props }, ref) {
    if (typeof href === 'string') {
      const [, first, ...rest] = href.split('/');

      if (locales.includes(first)) {
        return (
          <NextWepublishLink
            {...props}
            ref={ref}
            href={`/${rest.join('/')}`}
            locale={first}
          />
        );
      }
    }

    return (
      <NextWepublishLink
        {...props}
        ref={ref}
        href={href}
      />
    );
  }
);
