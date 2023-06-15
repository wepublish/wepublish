import {styled} from '@mui/material'
import {BuilderArticleProps} from '@wepublish/website/builder'
import {Block} from '@wepublish/website/api'
import {Blocks} from '@wepublish/block-content/website'

export const ArticleWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export function Article({className, data, loading, error}: BuilderArticleProps) {
  return (
    <ArticleWrapper className={className}>
      <Blocks blocks={(data?.article?.blocks as Block[]) ?? []} />
    </ArticleWrapper>
  )
}
