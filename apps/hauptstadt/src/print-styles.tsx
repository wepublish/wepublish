import {css, GlobalStyles} from '@mui/material'
import {ArticleWrapper} from '@wepublish/article/website'
import {BannerWrapper} from '@wepublish/banner/website'
import {
  ImageBlockWrapper,
  QuoteBlockWrapper,
  RichTextBlockWrapper,
  TeaserGridBlockWrapper
} from '@wepublish/block-content/website'
import {FooterWrapper, NavbarWrapper} from '@wepublish/navigation/website'
import {PaywallWrapper} from '@wepublish/paywall/website'

import {ArticleWrapperAppendix, ArticleWrapperComments} from '../pages/a/[slug]'
import {HauptstadtArticleMetaWrapper} from '../src/components/hauptstadt-article'

export const printStyles = (
  <GlobalStyles
    styles={css`
      @media print {
        ${HauptstadtArticleMetaWrapper},
        ${BannerWrapper},
        ${NavbarWrapper},
        ${FooterWrapper},
        ${ArticleWrapperComments},
        ${ArticleWrapperAppendix},
        ${TeaserGridBlockWrapper},
        ${PaywallWrapper} {
          display: none !important;
        }

        ${ArticleWrapper} {
          padding-left: 15%;
          padding-right: 15%;
        }

        ${ImageBlockWrapper},
        ${QuoteBlockWrapper} {
          page-break-inside: avoid;
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
)
