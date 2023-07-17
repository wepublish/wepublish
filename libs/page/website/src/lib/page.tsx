import {styled} from '@mui/material'
import {Blocks} from '@wepublish/block-content/website'
import {Block, Page as PageType} from '@wepublish/website/api'
import {BuilderPageProps, useWebsiteBuilder} from '@wepublish/website/builder'

export type PageProps = BuilderPageProps

export const PageWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export function Page({className, data, loading, error}: PageProps) {
  const {PageSEO} = useWebsiteBuilder()

  return (
    <PageWrapper className={className}>
      {data?.page && <PageSEO page={data.page as PageType} />}
      <Blocks blocks={(data?.page?.blocks as Block[]) ?? []} />
    </PageWrapper>
  )
}
