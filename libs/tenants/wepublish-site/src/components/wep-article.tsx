import { css, SerializedStyles, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { GlobalStyles } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  ArticleListWrapper,
  ArticleTrackingPixels,
} from '@wepublish/article/website';
import {
  ImageBlockWrapper,
  RichTextBlockWrapper,
  TitleBlockWrapper,
} from '@wepublish/block-content/website';
import { CommentListWrapper } from '@wepublish/comments/website';
import { ContentUnavailable, ContentWrapper } from '@wepublish/content/website';
import { FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderArticleProps,
  PeerInformation,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Paywall } from '@wepublish/website/builder';

import { ArticleInfo } from './article-info';
import { blockGap } from './wep-content-wrapper';
import { QuoteWrapper } from './wep-quote-block';

const fullWidthMainSpacer = (theme: Theme) => css`
  main > .MuiContainer-root {
    max-width: initial;
    padding: 0;
  }
`;

export const ArticleInfoWrapper = styled('aside')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-row-start: 2;
  // 40px below the lead of the intro, closer than the gap between blocks
  margin-top: calc(40px - ${blockGap});
  align-self: start;
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
  padding-bottom: ${({ theme }) => theme.spacing(14)};

  & > :is(.abc, .def) {
    margin-left: -${({ theme }) => theme.spacing(2)};
    margin-right: -${({ theme }) => theme.spacing(2)};
  }

  // The hero columns in the middle, each block as wide as in the design
  // (1273px hero columns: intro 1140, text 750, quote 1010, images and boxes 1273)
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns:
      minmax(0, 1fr)
      min(
        100% - 2 * ${({ theme }) => theme.spacing(3)},
        ${({ theme }) => theme.breakpoints.values.lg}px
      )
      minmax(0, 1fr) !important;

    // && outweighs the columns the content wrapper gives images and galleries
    && > * {
      grid-column: 2;
      margin-left: 0;
      margin-right: 0;
    }

    & > :is(${TitleBlockWrapper}, ${ArticleInfoWrapper}),
    & > ${TitleBlockWrapper} + ${ImageBlockWrapper} {
      width: calc(100% * 1140 / 1273);
      justify-self: start;
    }

    &
      > :is(
        ${RichTextBlockWrapper}, ${ArticleListWrapper}, ${CommentListWrapper}
      ) {
      width: calc(100% * 750 / 1273);
      justify-self: center;
    }

    & > ${QuoteWrapper} {
      width: calc(100% * 1010 / 1273);
      justify-self: center;
    }

    & > :is(.abc, .def) {
      grid-column: -1/1;
    }
  }

  // The intro leaves as much room below the navbar as the title block of a page
  & > ${TitleBlockWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      padding-top: 60px;
    }

    ${({ theme }) => theme.breakpoints.up('lg')} {
      padding-top: 100px;
    }
  }

  & > ${RichTextBlockWrapper} p {
    hyphens: manual;
  }

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

      ${
        fadeout &&
        css`
          // fade out the third block (usually richtext) to indicate the user that a paywall is hitting.
          > :nth-child(${hideContentAfter}) {
            ${fadeoutStyles}
          }
        `
      }
    `}
`;

const articleGlobalStyles = <GlobalStyles styles={fullWidthMainSpacer} />;

export function WepArticle({
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
    blocks: { Blocks },
  } = useWebsiteBuilder();

  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const article = data?.article;

  return (
    <ArticleWrapper
      className={className}
      hideContent={hideContent}
      hideContentAfter={article?.paywall?.hideContentAfter}
      fadeout={article?.paywall?.fadeout}
    >
      {isDesktop && articleGlobalStyles}

      {!article && !loading && <ContentUnavailable />}

      {article && <ArticleSEO article={article} />}

      {article && (
        <Blocks
          key={article.id}
          blocks={(article.latest.blocks as FullBlockFragment[]) ?? []}
          type="Article"
        />
      )}

      <ArticleInfoWrapper>
        {article && <ArticleInfo article={article} />}

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
