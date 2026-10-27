import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import {
  useHasRunningSubscription,
  useHasUnpaidInvoices,
} from '@wepublish/membership/website';
import {
  FeaturesDocument,
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderNavbarProps,
  LinkContext,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
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
    | 'navbarActions'
    | 'paperActions'
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
  navbarActions,
  paperActions,
  children,
}: NavbarContainerProps) {
  const { Navbar } = useWebsiteBuilder();
  const { data, loading, error } = useQuery(NavigationListDocument, {
    fetchPolicy: 'cache-first',
  });
  const { data: peerInfoData } = useQuery(PeerProfileDocument, {
    fetchPolicy: 'cache-first',
  });
  const hasUnpaidInvoices = useHasUnpaidInvoices();
  const hasRunningSubscription = useHasRunningSubscription();

  // In the account with the subscription history, the link to it is only
  // worth showing as the warning about an unpaid invoice. The features are
  // only asked for there: they need a session, and the pages prefetch them.
  const { hasUser } = useUser();
  const { asPath } = useRouter();
  const accountPath = profileBtn?.href ?? '/profile';
  const inAccount =
    asPath === accountPath || asPath.startsWith(`${accountPath}/`);
  const { data: features } = useQuery(FeaturesDocument, {
    skip: !hasUser || !inAccount,
  });
  const withinHistory = !!features?.features.includes(
    'profile-subscription-history'
  );
  // null, not undefined: the navbar would fall back to its default button
  const accountBtn =
    inAccount && withinHistory && !hasUnpaidInvoices ? null : profileBtn;

  const logo = peerInfoData?.peerProfile.logo;

  return (
    <LinkContext.Provider value={{ prefetch: true }}>
      <Navbar
        iconSlug={iconSlug}
        headerSlug={headerSlug}
        categorySlugs={categorySlugs}
        slug={slug}
        loginBtn={loginBtn}
        profileBtn={accountBtn}
        subscribeBtn={subscribeBtn}
        data={data}
        loading={loading}
        error={error}
        className={className}
        logo={logo}
        hasUnpaidInvoices={!!hasUnpaidInvoices}
        hasRunningSubscription={!!hasRunningSubscription}
        navbarActions={navbarActions}
        paperActions={paperActions}
      >
        {children}
      </Navbar>
    </LinkContext.Provider>
  );
}
