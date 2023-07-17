import {styled} from '@mui/material'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, Block} from '@wepublish/website/api'
import {Blocks} from '@wepublish/block-content/website'

export const ArticleWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const ArticleInfoWrapper = styled('section')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  justify-self: center;
`

export function Article({className, data, loading, error}: BuilderArticleProps) {
  const {AuthorChip, ArticleSEO} = useWebsiteBuilder()

  return (
    <ArticleWrapper className={className}>
      {data?.article && <ArticleSEO article={data.article as ArticleType} />}

      <Blocks blocks={(data?.article?.blocks as Block[]) ?? []} />

      <ArticleInfoWrapper>
        {data?.article?.authors.map(author => (
          <AuthorChip key={author.id} author={author} />
        ))}
      </ArticleInfoWrapper>
    </ArticleWrapper>
  )
}
