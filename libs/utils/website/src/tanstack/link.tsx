import { Link as TanStackLink } from '@tanstack/react-router';
import { Link as BuilderLink } from '@wepublish/ui';
import { BuilderLinkProps, useLinkProps } from '@wepublish/website/builder';
import { AnchorHTMLAttributes, forwardRef } from 'react';

/**
 * Replacement for `NextWepublishLink`.
 *
 * Differences from `next/link` worth knowing:
 *
 *  - TanStack's `Link` takes `to`, not `href`, and types it against the
 *    generated route tree. Our hrefs come from the CMS at runtime, so they are
 *    cast. An unknown path still renders and resolves to the not-found route
 *    on navigation, exactly like Next.
 *  - `prefetch` becomes `preload`: `true -> 'intent'` (hover/focus),
 *    `false -> false`. `next/link` prefetched on viewport entry; there is no
 *    exact equivalent.
 *  - Absolute URLs, `mailto:`, `tel:` and bare hashes must bypass the router,
 *    otherwise TanStack tries to resolve them as internal paths.
 */
const isExternal = (href: string) =>
  /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) ||
  /^(mailto:|tel:|sms:)/i.test(href) ||
  href.startsWith('#');

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Two stable components instead of one with a `preload` prop: MUI's `Link`
 * forwards unknown props to the `component`, but its *types* do not allow
 * extra props, so passing `preload` through `BuilderLink` does not type check.
 * Picking the component by the flag keeps both the types and the React
 * reconciler happy (a component created inline per render would remount the
 * anchor on every update).
 */
const makeRouterAnchor = (preload: 'intent' | false) =>
  forwardRef<HTMLAnchorElement, AnchorProps>(function RouterAnchor(
    { href, ...props },
    ref
  ) {
    return (
      <TanStackLink
        {...props}
        ref={ref}
        to={(href ?? '/') as string}
        preload={preload}
      />
    );
  });

const PreloadingAnchor = makeRouterAnchor('intent');
const PlainAnchor = makeRouterAnchor(false);

export const WepublishLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function WepublishLink({ children, href, variant, ...props }, ref) {
  const linkProps = useLinkProps(props);
  const target = href ?? '';

  if (process.env.APP_ENVIRONMENT !== 'production') {
    linkProps.prefetch = false;
  }

  // `prefetch` and `locale` are next/link props; never let them reach the DOM.
  const { prefetch, locale: _locale, ...rest } = linkProps;

  if (!target || isExternal(target)) {
    return (
      <BuilderLink
        {...rest}
        ref={ref}
        href={target}
        variant={variant}
      >
        {children}
      </BuilderLink>
    );
  }

  return (
    <BuilderLink
      {...rest}
      ref={ref}
      component={prefetch ? PreloadingAnchor : PlainAnchor}
      href={target}
      variant={variant}
    >
      {children}
    </BuilderLink>
  );
});
