import { useNavigationListQuery } from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderFooterProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';

export type FooterContainerProps = PropsWithChildren<
  Pick<BuilderFooterProps, 'slug' | 'iconSlug' | 'categorySlugs'> &
    Partial<
      Pick<BuilderFooterProps, 'hideBannerOnIntersecting' | 'wepublishLogo'>
    >
> &
  BuilderContainerProps;

export function FooterContainer({
  slug,
  iconSlug,
  categorySlugs,
  children,
  className,
  hideBannerOnIntersecting = true,
  wepublishLogo = 'light',
}: FooterContainerProps) {
  const { Footer } = useWebsiteBuilder();
  const { data, loading, error } = useNavigationListQuery();

  return (
    <Footer
      data={data}
      loading={loading}
      error={error}
      slug={slug}
      className={className}
      iconSlug={iconSlug}
      categorySlugs={categorySlugs}
      hideBannerOnIntersecting={hideBannerOnIntersecting}
      wepublishLogo={wepublishLogo}
    >
      {children}
    </Footer>
  );
}
