import {useNavigationListQuery, usePeerProfileQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderNavbarProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export type NavbarContainerProps = PropsWithChildren<
  Pick<
    BuilderNavbarProps,
    | 'categorySlugs'
    | 'slug'
    | 'headerSlug'
    | 'loginUrl'
    | 'profileUrl'
    | 'subscriptionsUrl'
    | 'actions'
  > &
    BuilderContainerProps
>

export function NavbarContainer({
  className,
  categorySlugs,
  headerSlug,
  slug,
  loginUrl,
  profileUrl,
  subscriptionsUrl,
  children,
  actions
}: NavbarContainerProps) {
  const {Navbar} = useWebsiteBuilder()
  const {data, loading, error} = useNavigationListQuery()
  const {data: peerInfoData} = usePeerProfileQuery()
  const logo = peerInfoData?.peerProfile.logo

  return (
    <Navbar
      headerSlug={headerSlug}
      categorySlugs={categorySlugs}
      slug={slug}
      loginUrl={loginUrl}
      profileUrl={profileUrl}
      subscriptionsUrl={subscriptionsUrl}
      data={data}
      loading={loading}
      error={error}
      className={className}
      logo={logo}
      actions={actions}>
      {children}
    </Navbar>
  )
}
