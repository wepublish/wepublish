import { useQuery } from '@apollo/client/react';
import {
  useAccountSetupPending,
  useUser,
} from '@wepublish/authentication/website';
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
  BuilderRouterContext,
  LinkContext,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren, useContext } from 'react';

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
  const hasRunningSubscription = useHasRunningSubscription();
  const accountSetupPending = useAccountSetupPending();

  // With the subscription history, the warning is about due invoices only,
  // and in the account the link to it is only worth showing as that warning.
  // The features need a session, so they are asked for only with one.
  const { hasUser } = useUser();
  const { asPath } = useContext(BuilderRouterContext);
  const accountPath = profileBtn?.href ?? '/profile';
  const inAccount =
    asPath === accountPath || asPath.startsWith(`${accountPath}/`);
  const { data: features } = useQuery(FeaturesDocument, {
    skip: !hasUser,
  });
  const withinHistory = !!features?.features.includes(
    'profile-subscription-history'
  );
  const hasUnpaidInvoices = useHasUnpaidInvoices({ dueOnly: withinHistory });
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
        accountSetupPending={accountSetupPending}
        navbarActions={navbarActions}
        paperActions={paperActions}
      >
        {children}
      </Navbar>
    </LinkContext.Provider>
  );
}
