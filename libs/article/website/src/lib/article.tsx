import styled from '@emotion/styled'
import {BuilderArticleProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Article as ArticleType, BlockContent} from '@wepublish/website/api'
import {ArticleListWrapper} from './article-list/article-list'
import {CommentListWrapper} from '@wepublish/comments/website'
import {ContentWrapper} from '@wepublish/content/website'
import {ArticleTrackingPixels} from './article-tracking-pixels'
import {Paywall} from '@wepublish/website/builder'
import {css} from '@emotion/react'

import {useShowPaywall} from '@wepublish/paywall/website'

export const ArticleInfoWrapper = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  grid-row-start: 2;
`

export const ArticleWrapper = styled(ContentWrapper)<{showPaywall?: boolean}>`
  ${({showPaywall}) =>
    showPaywall &&
    css`
      // Shows the first 3 blocks (usually title, image, richtext) and hides the rest
      > :nth-child(n + 4):not(:is(${ArticleInfoWrapper})) {
        display: none;
      }

      // fade out the third block (usually richtext) to indicate the user that a paywall is hitting.
      > :nth-child(3) {
        max-height: 250px;
        overflow-x: hidden;
        overflow-y: hidden;
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 100%);
      }
    `}

  ${({theme}) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`

export function Article({className, data, children, loading, error}: BuilderArticleProps) {
  const {
    ArticleSEO,
    ArticleAuthors,
    ArticleMeta,
    blocks: {Blocks}
  } = useWebsiteBuilder()

  const article = data?.article as ArticleType

  const showPaywall = useShowPaywall(article.paywall)

  return (
    <ArticleWrapper className={className} showPaywall={showPaywall}>
      {article && <ArticleSEO article={article} />}

      {article && (
        <Blocks
          key={article.id}
          blocks={(article.latest.blocks as BlockContent[]) ?? []}
          type="Article"
        />
      )}

      <ArticleInfoWrapper>
        {article && <ArticleAuthors article={article} />}
        {article && <ArticleMeta article={article} />}
      </ArticleInfoWrapper>

      {showPaywall && <Paywall {...article.paywall!} />}

      {children}

      <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
    </ArticleWrapper>
  )
}
