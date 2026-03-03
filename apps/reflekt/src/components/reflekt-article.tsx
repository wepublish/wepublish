import { css, SerializedStyles, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { GlobalStyles } from '@mui/material';
import {
  ArticleListWrapper,
  ArticleTrackingPixels,
} from '@wepublish/article/website';
import {
  BreakBlockWrapper,
  EventBlockWrapper,
  ImageBlockWrapper,
  ImageGalleryBlockWrapper,
  SliderWrapper,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockWrapper,
  TeaserSlotsBlockWrapper,
  TitleBlockPreTitleWrapper,
  TitleBlockTitle,
  TitleBlockWrapper,
} from '@wepublish/block-content/website';
import { CommentListWrapper } from '@wepublish/comments/website';
import { ContentWrapper } from '@wepublish/content/website';
import { SubscribeWrapper } from '@wepublish/membership/website';
import { Article as ArticleType, BlockContent } from '@wepublish/website/api';
import {
  BuilderArticleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Paywall } from '@wepublish/website/builder';

import { FlexBlockHeroWrapper } from './block-layouts/flex-block-hero';
import { ReflektCollapsibleRichTextWrapper } from './block-styles/reflekt-collapsible-richtext';

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
  padding-top: var(--navbar-height);

  ${TitleBlockWrapper} {
    ${TitleBlockPreTitleWrapper} {
      display: none;
    }

    ${TitleBlockTitle} {
      display: none;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns:
      max(calc(100vw - 1333px) / 2, 0px) repeat(12, 1fr)
      max(calc(100vw - 1333px) / 2, 0px) !important;

    & > * {
      grid-column: 5/11;
    }

    &
      > :is(
        ${ImageBlockWrapper},
          ${SliderWrapper},
          ${EventBlockWrapper},
          ${BreakBlockWrapper},
          ${ReflektCollapsibleRichTextWrapper}
      ) {
      grid-column: 3/13;
    }

    &
      > :is(
        ${TeaserGridFlexBlockWrapper},
          ${TeaserGridBlockWrapper},
          ${TeaserListBlockWrapper},
          ${TeaserSlotsBlockWrapper},
          ${ImageGalleryBlockWrapper},
          ${SubscribeWrapper}
      ) {
      grid-column: 2/12;
    }

    & > :is(${FlexBlockHeroWrapper}) {
      grid-column: -1/1;
    }
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
      grid-column: 3/13;
    }
  }
`;

const articleGlobalStyles = <GlobalStyles styles={fullWidthMainSpacer} />;

export function ReflektArticle({
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
    //ArticleAuthors,
    //ArticleMeta,
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
      {articleGlobalStyles}

      {article && <ArticleSEO article={article} />}

      {article && (
        <Blocks
          key={article.id}
          blocks={(article.latest.blocks as BlockContent[]) ?? []}
          type="Article"
        />
      )}

      {/*
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
*/}
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
