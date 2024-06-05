import {styled} from '@mui/material'
import {CommentListWrapper} from '@wepublish/website'
import {ArticleListWrapper, ContentWrapper} from '@wepublish/website'
import {Blocks} from '@wepublish/website'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website'
import {ApiV1} from '@wepublish/website'

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

export function BajourArticle({className, data, children}: BuilderArticleProps) {
  const {ArticleSEO} = useWebsiteBuilder()

  return (
    <ArticleWrapper className={className}>
      {data?.article && <ArticleSEO article={data.article as ApiV1.Article} />}
      <Blocks blocks={(data?.article?.blocks as ApiV1.Block[]) ?? []} type="Article" />
      {children}
    </ArticleWrapper>
  )
}
