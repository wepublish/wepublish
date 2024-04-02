import {styled} from '@mui/material'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, Block} from '@wepublish/website/api'
import {Blocks} from '@wepublish/block-content/website'
import {ArticleListWrapper} from './article-list/article-list'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

export const ArticleInfoWrapper = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-row-start: 2;
`

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {AuthorChip, ArticleSEO} = useWebsiteBuilder()

  return (
    <ArticleWrapper className={className}>
      {data?.article && <ArticleSEO article={data.article as ArticleType} />}

      <Blocks blocks={(data?.article?.blocks as Block[]) ?? []} />

      <ArticleInfoWrapper>
        {data?.article?.authors.map(author => (
          <AuthorChip key={author.id} author={author} publishedAt={data.article!.publishedAt} />
        ))}
      </ArticleInfoWrapper>

      {children}
    </ArticleWrapper>
  )
}
