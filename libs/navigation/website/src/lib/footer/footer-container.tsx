import {useNavigationListQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export type FooterContainerProps = PropsWithChildren<{
  slug: string
  categorySlugs: string[][]
}> &
  BuilderContainerProps

export function FooterContainer({slug, children, className, categorySlugs}: FooterContainerProps) {
  const {Footer} = useWebsiteBuilder()
  const {data, loading, error} = useNavigationListQuery()

  return (
    <Footer
      data={data}
      loading={loading}
      error={error}
      slug={slug}
      className={className}
      categorySlugs={categorySlugs}>
      {children}
    </Footer>
  )
}
