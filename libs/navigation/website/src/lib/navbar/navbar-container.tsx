import {useNavigationListQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderNavbarProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export type NavbarContainerProps = PropsWithChildren<
  Pick<BuilderNavbarProps, 'categorySlugs' | 'slug' | 'logo'> & BuilderContainerProps
>

export function NavbarContainer({
  className,
  categorySlugs,
  slug,
  children,
  logo
}: NavbarContainerProps) {
  const {Navbar} = useWebsiteBuilder()
  const {data, loading, error} = useNavigationListQuery()

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
