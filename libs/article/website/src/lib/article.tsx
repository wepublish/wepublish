import styled from '@emotion/styled';
import {
  BuilderArticleProps,
  PeerInformation,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Article as ArticleType, BlockContent } from '@wepublish/website/api';
import { ArticleListWrapper } from './article-list/article-list';
import { CommentListWrapper } from '@wepublish/comments/website';
import { ContentWrapper } from '@wepublish/content/website';
import { ArticleTrackingPixels } from './article-tracking-pixels';
import { Paywall } from '@wepublish/website/builder';
import { css, SerializedStyles } from '@emotion/react';

export const ArticleInfoWrapper = styled('aside')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-row-start: 2;
`;

export const defaultFadeoutStyles = css`
  max-height: 250px;
  overflow-x: hidden;
  overflow-y: hidden;
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0) 100%
  );
`;

export const ArticleWrapper = styled(ContentWrapper)<{
  hideContent?: boolean;
  hideContentAfter?: number;
  fadeout?: boolean;
  fadeoutStyles?: SerializedStyles;
}>`
  ${({
    hideContent,
    fadeoutStyles = defaultFadeoutStyles,
    hideContentAfter = 3,
    fadeout,
  }) =>
    hideContent &&
    css`
      // Shows the first N blocks (usually title, image, richtext) and hides the rest
      > :nth-child(n + ${hideContentAfter + 1}):not(
          :is(${ArticleInfoWrapper})
        ) {
        display: none;
      }

      ${fadeout &&
      css`
        // fade out the third block (usually richtext) to indicate the user that a paywall is hitting.
        > :nth-child(${hideContentAfter}) {
          ${fadeoutStyles}
        }
      `}
    `}

  ${({ theme }) => theme.breakpoints.up('md')} {
    & > :is(${ArticleListWrapper}, ${CommentListWrapper}) {
      grid-column: 2/12;
    }
  }
`;

export function Article({
  className,
  data,
  children,
  showPaywall,
  hideContent,
  loading,
  error,
}: BuilderArticleProps) {
  const {
    ArticleSEO,
    ArticleAuthors,
    ArticleMeta,
    blocks: { Blocks },
  } = useWebsiteBuilder();

  const article = data?.article as ArticleType | undefined;

  return (
    <ArticleWrapper
      className={className}
      hideContent={hideContent}
      hideContentAfter={article?.paywall?.hideContentAfter}
      fadeout={article?.paywall?.fadeout}
    >
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

        {data?.article?.peer && (
          <PeerInformation
            {...data.article.peer}
            originUrl={data.article.latest.canonicalUrl ?? undefined}
          />
        )}
      </ArticleInfoWrapper>

      {showPaywall && article?.paywall && (
        <Paywall
          {...article.paywall}
          hideContent={hideContent}
        />
      )}

      {children}

      <ArticleTrackingPixels trackingPixels={article?.trackingPixels} />
    </ArticleWrapper>
  );
}
