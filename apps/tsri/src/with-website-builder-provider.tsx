import { ThemeProvider } from '@mui/material';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ComponentProps } from 'react';

import { TabbedContent } from '../src/block-styles/tsri-tabbed-content';
import { TsriArticleDate } from '../src/components/tsri-article-date';
import { TsriArticleList } from '../src/components/tsri-article-list';
import { TsriArticleMeta } from '../src/components/tsri-article-meta';
import { TSRIAuthor } from '../src/components/tsri-author';
import { TSRIAuthorLinks } from '../src/components/tsri-author-links';
import { TSRIAuthorList } from '../src/components/tsri-author-list';
import { TsriBanner } from '../src/components/tsri-banner';
import { TsriBaseTeaser } from '../src/components/teasers/tsri-base-teaser';
import { TsriBreakBlock } from '../src/components/tsri-break-block';
import { TsriContextBox } from '../src/components/tsri-context-box';
import { TSRIFooter } from '../src/components/tsri-footer';
import { TsriQuoteBlock } from '../src/components/tsri-quote-block';
import { TsriRichText } from '../src/components/tsri-richtext';
import { TsriTeaserGridFlex } from '../src/components/tsri-teaser-grid-flex';
import { TsriV2Navbar } from '../src/components/tsri-v2-navbar';
import theme from '../src/theme';

export const WithWebsiteBuilderProvider = (
  props: ComponentProps<typeof WebsiteBuilderProvider>
) => (
  <WebsiteBuilderProvider
    Footer={TSRIFooter}
    Navbar={TsriV2Navbar}
    ArticleDate={TsriArticleDate}
    ArticleMeta={TsriArticleMeta}
    ArticleList={TsriArticleList}
    Author={TSRIAuthor}
    AuthorLinks={TSRIAuthorLinks}
    AuthorList={TSRIAuthorList}
    blocks={{
      BaseTeaser: TsriBaseTeaser,
      TeaserGridFlex: TsriTeaserGridFlex,
      Break: TsriBreakBlock,
      Quote: TsriQuoteBlock,
      RichText: TsriRichText,
    }}
    blockStyles={{
      ContextBox: TsriContextBox,
      TabbedContent,
    }}
    Banner={TsriBanner}
  >
    <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
  </WebsiteBuilderProvider>
);
