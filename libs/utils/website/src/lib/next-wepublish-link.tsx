import { Link as BuilderLink } from '@wepublish/ui';
import { BuilderLinkProps } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { forwardRef, MouseEvent as ReactMouseEvent, useEffect } from 'react';

// Bypasses next/link to avoid the viewport+hover prefetch storm on
// tag/author/list pages (Pages Router's prefetch={false} disables viewport
// prefetch but not hover). Callers that need prefetch can opt in with
// prefetch={true}; we then call router.prefetch on mount.
export const NextWepublishLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { prefetch?: boolean }
>(function NextWepublishLink(
  { children, href, onClick, prefetch = false, ...props },
  ref
) {
  const router = useRouter();
  const target = (props as { target?: string }).target;

  useEffect(() => {
    if (prefetch && href && isInternalHref(href)) {
      router.prefetch(href);
    }
  }, [prefetch, href, router]);

  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) {
      return;
    }
    if (!href) {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (target && target !== '_self') {
      return;
    }
    if (!isInternalHref(href)) {
      return;
    }

    e.preventDefault();
    router.push(href);
  };

  return (
    <BuilderLink
      {...props}
      ref={ref}
      href={href ?? ''}
      onClick={handleClick}
    >
      {children}
    </BuilderLink>
  );
});

function isInternalHref(href: string): boolean {
  return href.startsWith('/') || href.startsWith('#');
}
