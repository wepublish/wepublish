import {styled} from '@mui/material'
import {BuilderPageProps} from '@wepublish/website/builder'
import {Block} from '@wepublish/website/api'
import {Blocks} from '@wepublish/block-content/website'

export type PageProps = BuilderPageProps

const PageWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export function Page({className, data, loading, error}: PageProps) {
  return (
    <PageWrapper className={className}>
      <Blocks blocks={(data?.page?.blocks as Block[]) ?? []} />
    </PageWrapper>
  )
}
