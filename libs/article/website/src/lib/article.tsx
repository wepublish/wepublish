import {Chip, styled} from '@mui/material'
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

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {
    ArticleSEO,
    ArticleAuthors,
    elements: {Link},
    blocks: {Blocks}
  } = useWebsiteBuilder()

  const article = data?.article

  return (
    <ArticleWrapper className={className}>
      {article && <ArticleSEO article={data.article as ArticleType} />}

      <Blocks blocks={(article?.blocks as Block[]) ?? []} type="Article" />

      <ArticleInfoWrapper>
        {article && <ArticleAuthors article={article as ArticleType} />}

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
