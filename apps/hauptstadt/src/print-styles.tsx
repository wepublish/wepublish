import { css, GlobalStyles } from '@mui/material';
import { ArticleWrapper } from '@wepublish/article/website';
import { BannerWrapper } from '@wepublish/banner/website';
import {
  ImageBlockCaption,
  ImageBlockWrapper,
  QuoteBlockWrapper,
  RichTextBlockWrapper,
  TeaserGridBlockWrapper,
} from '@wepublish/block-content/website';
import { FooterWrapper } from '@wepublish/navigation/website';
import { PaywallWrapper } from '@wepublish/paywall/website';

import {
  ArticleWrapperAppendix,
  ArticleWrapperComments,
} from '../pages/a/[slug]';
import { HauptstadtArticleMetaWrapper } from '../src/components/hauptstadt-article';
import { HauptstadtBannerContainer } from './components/hauptstadt-banner';
import { NavbarWrapper } from './components/hauptstadt-navbar';

export const printStyles = (
  <GlobalStyles
    styles={css`
      @media print {
        ${HauptstadtArticleMetaWrapper},
        ${BannerWrapper},
        ${HauptstadtBannerContainer},
        ${NavbarWrapper},
        ${FooterWrapper},
        ${ArticleWrapperComments},
        ${ArticleWrapperAppendix},
        ${TeaserGridBlockWrapper},
        ${PaywallWrapper}${PaywallWrapper} {
          display: none !important;
        }

        ${ArticleWrapper} {
          padding-left: 15%;
          padding-right: 15%;
        }

        ${ImageBlockWrapper},
        ${QuoteBlockWrapper},
        ul,
        ol {
          page-break-inside: avoid;
        }

        ${ImageBlockCaption} {
          width: initial !important;
        }

        ${RichTextBlockWrapper} :is(p, ul, li, ol) {
          font-size: 13px !important;
        }

        iframe {
          max-height: 90vh;
        }
      }
    `}
  />
);
