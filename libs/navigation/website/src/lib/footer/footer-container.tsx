import {useNavigationListQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export type FooterContainerProps = PropsWithChildren<{
  slug: string
  categorySlugs: string[][]
  iconSlug?: string
  hideBannerOnIntersecting?: boolean
}> &
  BuilderContainerProps

export function FooterContainer({
  slug,
  iconSlug,
  categorySlugs,
  children,
  className,
  hideBannerOnIntersecting = true
}: FooterContainerProps) {
  const {Footer} = useWebsiteBuilder()
  const {data, loading, error} = useNavigationListQuery()

  return (
    <Footer
      data={data}
      loading={loading}
      error={error}
      slug={slug}
      className={className}
      iconSlug={iconSlug}
      categorySlugs={categorySlugs}
      hideBannerOnIntersecting={hideBannerOnIntersecting}>
      {children}
    </Footer>
  )
}
