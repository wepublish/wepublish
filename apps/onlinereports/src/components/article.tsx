import styled from '@emotion/styled'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, BlockContent} from '@wepublish/website/api'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {ArticleListWrapper} from '@wepublish/article/website'
import {ArticleTrackingPixels} from '../../../../libs/article/website/src/lib/article-tracking-pixels'

export const ArticleWrapper = styled(ContentWrapper)`
  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

export function OnlineReportsArticle({
  className,
  data,
  children,
  loading,
  error
}: BuilderArticleProps) {
  const {
    ArticleSEO,
    ArticleAuthors,
    ArticleMeta,
    blocks: {Blocks}
  } = useWebsiteBuilder()

  const article = data?.article as ArticleType

  return (
    <ArticleWrapper className={className}>
      {article && <ArticleSEO article={article} />}

      <Blocks blocks={(article?.latest.blocks as BlockContent[]) ?? []} type="Article" />

      {article && <ArticleAuthors article={article} />}

      {children}

      {article && <ArticleMeta article={article} />}

      <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
    </ArticleWrapper>
  )
}
