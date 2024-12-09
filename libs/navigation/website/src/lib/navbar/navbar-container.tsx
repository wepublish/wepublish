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
    'categorySlugs' | 'slug' | 'headerSlug' | 'iconSlug' | 'loginUrl' | 'profileUrl' | 'actions'
  > &
    BuilderContainerProps
>

export function NavbarContainer({
  className,
  categorySlugs,
  headerSlug,
  slug,
  iconSlug,
  loginUrl,
  profileUrl,
  children,
  actions
}: NavbarContainerProps) {
  const {Navbar} = useWebsiteBuilder()
  const {data, loading, error} = useNavigationListQuery()
  const {data: peerInfoData} = usePeerProfileQuery()
  const logo = peerInfoData?.peerProfile.logo

  return (
    <Navbar
      iconSlug={iconSlug}
      headerSlug={headerSlug}
      categorySlugs={categorySlugs}
      slug={slug}
      loginUrl={loginUrl}
      profileUrl={profileUrl}
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
