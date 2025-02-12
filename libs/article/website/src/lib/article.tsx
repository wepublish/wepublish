import {styled} from '@mui/material'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, Block} from '@wepublish/website/api'
import {ArticleListWrapper} from './article-list/article-list'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {ArticleTrackingPixels} from './article-tracking-pixels'

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

export const ArticleInfoWrapper = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  grid-row-start: 2;
`

export const ArticleAuthors = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {
    AuthorChip,
    ArticleSEO,
    ArticleDate,
    ArticleMeta,
    blocks: {Blocks}
  } = useWebsiteBuilder()

  const article = data?.article as ArticleType
  const authors = article?.authors.filter(author => !author.hideOnArticle) || []

  return (
    <ArticleWrapper className={className}>
      {article && <ArticleSEO article={article} />}
      <Blocks blocks={(article?.blocks as Block[]) ?? []} type="Article" />

      <ArticleInfoWrapper>
        {!!authors.length && (
          <ArticleAuthors>
            {authors.map(author => (
              <AuthorChip key={author.id} author={author} />
            ))}

            <ArticleDate article={article} />
          </ArticleAuthors>
        )}

        {article && <ArticleMeta article={article} />}
      </ArticleInfoWrapper>

      {children}

      <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
    </ArticleWrapper>
  )
}
