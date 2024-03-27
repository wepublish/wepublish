import {styled} from '@mui/material'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, Block} from '@wepublish/website/api'
import {
  Blocks,
  BreakBlockWrapper,
  ImageBlockWrapper,
  QuoteBlockWrapper,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockWrapper
} from '@wepublish/block-content/website'
import {ArticleListWrapper} from './article-list/article-list'
import {CommentListWrapper} from '@wepublish/comments/website'

export const ArticleWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(7)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(12, 1fr);

    & > * {
      grid-column: 4/10;
    }

    &
      > :is(
        ${ImageBlockWrapper},
          ${BreakBlockWrapper},
          ${TeaserGridFlexBlockWrapper},
          ${TeaserGridBlockWrapper},
          ${TeaserListBlockWrapper},
          ${ArticleListWrapper},
          ${CommentListWrapper}
      ) {
      grid-column: 2/12;
    }

    & > ${QuoteBlockWrapper} {
      grid-column-start: 5;
    }
  }
`

export const ArticleInfoWrapper = styled('aside')`
  grid-row-start: 2;
`

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {AuthorChip, ArticleSEO, date} = useWebsiteBuilder()

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
