import {Chip} from '@mui/material'
import styled from '@emotion/styled'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, Block} from '@wepublish/website/api'
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

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {
    AuthorChip,
    ArticleSEO,
    ArticleDate,
    elements: {Link},
    blocks: {Blocks}
  } = useWebsiteBuilder()

  const article = data?.article
  const authors = article?.authors.filter(author => !author.hideOnArticle) || []

  return (
    <ArticleWrapper className={className}>
      {article && <ArticleSEO article={data.article as ArticleType} />}

      <Blocks blocks={(article?.blocks as Block[]) ?? []} type="Article" />

      <ArticleInfoWrapper>
        {!!authors.length && (
          <ArticleAuthors>
            {authors.map(author => (
              <AuthorChip key={author.id} author={author} />
            ))}

            <ArticleDate article={article as ArticleType} />
          </ArticleAuthors>
        )}

        {!!article?.tags.length && (
          <ArticleTags>
            {article.tags.map(tag => (
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
