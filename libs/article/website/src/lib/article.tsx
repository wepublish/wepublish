import {Chip, styled} from '@mui/material'
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
  gap: ${({theme}) => theme.spacing(4)};
  grid-row-start: 2;
`

export const ArticleTags = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

export const ArticleAuthors = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const ArticleDate = styled('time')`
  margin-top: -${({theme}) => theme.spacing(2)};
`

export function Article({
  className,
  data,
  children,
  hideAuthors,
  hideTags,
  loading,
  error
}: BuilderArticleProps) {
  const {
    AuthorChip,
    ArticleSEO,
    elements: {Link},
    date
  } = useWebsiteBuilder()

  return (
    <ArticleWrapper className={className}>
      {data?.article && <ArticleSEO article={data.article as ArticleType} />}

      <Blocks blocks={(data?.article?.blocks as Block[]) ?? []} type="Article" />

      <ArticleInfoWrapper>
        {!!data?.article?.authors.length && !hideAuthors && (
          <ArticleAuthors>
            {data.article.authors.map(author => (
              <AuthorChip key={author.id} author={author} />
            ))}

            {data.article.publishedAt && (
              <ArticleDate suppressHydrationWarning dateTime={data.article.publishedAt}>
                {date.format(new Date(data.article.publishedAt), false)}
              </ArticleDate>
            )}
          </ArticleAuthors>
        )}

        {!!data?.article?.tags.length && !hideTags && (
          <ArticleTags>
            {data.article.tags.map(tag => (
              <Chip
                key={tag.id}
                label={tag.tag}
                component={Link}
                href={tag.url}
                color="primary"
                variant="outlined"
                clickable
              />
            ))}
          </ArticleTags>
        )}
      </ArticleInfoWrapper>

      {children}
    </ArticleWrapper>
  )
}
