import {styled} from '@mui/material'
import {BuilderPageProps} from '@wepublish/website-builder'
import {Block} from '@wepublish/website/api'
import {Blocks} from '@wepublish/block-content/website'

export type PageProps = BuilderPageProps

const PageWrapper = styled('div')``

export function Page({data, loading, error}: PageProps) {
  return (
    <PageWrapper>
      <Blocks blocks={(data?.page?.blocks as Block[]) ?? []} />
    </PageWrapper>
  )
}
