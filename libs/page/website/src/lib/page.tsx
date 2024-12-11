import {styled} from '@mui/material'
import {ContentWrapper} from '@wepublish/content/website'
import {BlockContent, Page as PageType} from '@wepublish/website/api'
import {BuilderPageProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const PageWrapper = styled(ContentWrapper)``

export function Page({className, data, loading, error, children}: BuilderPageProps) {
  const {
    PageSEO,
    blocks: {Blocks}
  } = useWebsiteBuilder()

  return (
    <PageWrapper className={className}>
      {data?.page && <PageSEO page={data.page as PageType} />}
      <Blocks blocks={(data?.page?.published?.blocks as BlockContent[]) ?? []} type="Page" />
      {children}
    </PageWrapper>
  )
}
