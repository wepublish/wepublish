import {
  useHasRunningSubscription,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import {
  useNavigationListQuery,
  usePeerProfileQuery,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderNavbarProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';

export type NavbarContainerProps = PropsWithChildren<
  Pick<
    BuilderNavbarProps,
    | 'categorySlugs'
    | 'slug'
    | 'headerSlug'
    | 'iconSlug'
    | 'loginBtn'
    | 'profileBtn'
    | 'subscribeBtn'
  > &
    BuilderContainerProps
>;

export function NavbarContainer({
  className,
  categorySlugs,
  headerSlug,
  slug,
  iconSlug,
  loginBtn,
  profileBtn,
  subscribeBtn,
  children,
}: NavbarContainerProps) {
  const { Navbar } = useWebsiteBuilder();
  const { data, loading, error } = useNavigationListQuery();
  const { data: peerInfoData } = usePeerProfileQuery();
  const hasUnpaidInvoices = useHasUnpaidInvoices();
  const hasRunningSubscription = useHasRunningSubscription();

  const logo = peerInfoData?.peerProfile.logo;

  return (
    <Navbar
      iconSlug={iconSlug}
      headerSlug={headerSlug}
      categorySlugs={categorySlugs}
      slug={slug}
      loginBtn={loginBtn}
      profileBtn={profileBtn}
      subscribeBtn={subscribeBtn}
      data={data}
      loading={loading}
      error={error}
      className={className}
      logo={logo}
      hasUnpaidInvoices={!!hasUnpaidInvoices}
      hasRunningSubscription={!!hasRunningSubscription}
    >
      {children}
    </Navbar>
  );
}
