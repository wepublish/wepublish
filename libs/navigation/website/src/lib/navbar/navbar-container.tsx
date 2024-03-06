import {useNavigationListQuery, usePeerProfileQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderNavbarProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export type NavbarContainerProps = PropsWithChildren<
  Pick<BuilderNavbarProps, 'categorySlugs' | 'slug'> & BuilderContainerProps
>

export function NavbarContainer({className, categorySlugs, slug, children}: NavbarContainerProps) {
  const {Navbar} = useWebsiteBuilder()
  const {data, loading, error} = useNavigationListQuery()
  const {data: peerInfoData} = usePeerProfileQuery()
  const logo = peerInfoData?.peerProfile.logo

  return (
    <Navbar
      categorySlugs={categorySlugs}
      slug={slug}
      data={data}
      loading={loading}
      error={error}
      className={className}
      logo={logo}>
      {children}
    </Navbar>
  )
}
