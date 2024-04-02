import {styled} from '@mui/material'
import {Blocks} from '@wepublish/block-content/website'
import {ContentWrapper} from '@wepublish/content/website'
import {Block, Page as PageType} from '@wepublish/website/api'
import {BuilderPageProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const PageWrapper = styled(ContentWrapper)``

export function Page({className, data, loading, error, children}: BuilderPageProps) {
  const {PageSEO} = useWebsiteBuilder()

  return (
    <PageWrapper className={className}>
      {data?.page && <PageSEO page={data.page as PageType} />}
      <Blocks blocks={(data?.page?.blocks as Block[]) ?? []} type="Page" />
      {children}
    </PageWrapper>
  )
}
