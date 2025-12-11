/* eslint-disable react/display-name */
import { ThemeProvider } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { act } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { initWePublishTranslator } from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { SessionWithTokenWithoutUser, User } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { setDefaultOptions } from 'date-fns';
import { de } from 'date-fns/locale';
import NextScript from 'next/script';
import { ComponentProps } from 'react';
import {
  ComponentType,
  memo,
  PropsWithChildren,
  useCallback,
  useState,
} from 'react';

import deOverriden from '../locales/deOverriden.json';
import { TabbedContent } from '../src/block-styles/tsri-tabbed-content';
import { TsriBaseTeaserGridFlex } from '../src/components/teaser-layouts/tsri-base-teaser-flex-grid';
import { TsriBaseTeaserSlots } from '../src/components/teaser-layouts/tsri-base-teaser-slots';
import { TsriBaseTeaser } from '../src/components/teasers/tsri-base-teaser';
import { TsriArticle } from '../src/components/tsri-article';
import { TsriArticleDate } from '../src/components/tsri-article-date';
import { TsriArticleList } from '../src/components/tsri-article-list';
import { TsriArticleMeta } from '../src/components/tsri-article-meta';
import { TSRIAuthor } from '../src/components/tsri-author';
import { TSRIAuthorLinks } from '../src/components/tsri-author-links';
import { TSRIAuthorList } from '../src/components/tsri-author-list';
import { TsriBanner } from '../src/components/tsri-banner';
import { TsriBreakBlock } from '../src/components/tsri-break-block';
import { TsriContextBox } from '../src/components/tsri-context-box';
import { TSRIFooter } from '../src/components/tsri-footer';
import { TsriQuoteBlock } from '../src/components/tsri-quote-block';
import { TsriRichText } from '../src/components/tsri-richtext';
import { TsriTitleBlock } from '../src/components/tsri-title-block';
import { TsriV2Navbar } from '../src/components/tsri-v2-navbar';
import theme from '../src/theme';
import { TsriBlockRenderer } from '../src/tsri-block-renderer';

const SessionProvider = memo<PropsWithChildren>(({ children }) => {
  const [token, setToken] = useState<SessionWithTokenWithoutUser | null>();
  const [user, setUser] = useState<User | null>(null);

  const setTokenAndGetMe = useCallback(
    async (newToken: SessionWithTokenWithoutUser | null) => {
      await act(() => setToken(newToken));

      if (newToken) {
        await act(() =>
          setUser({
            id: '1234-1234',
            firstName: 'Foo',
            name: 'Bar',
            email: 'foobar@example.com',
            paymentProviderCustomers: [],
            properties: [],
            permissions: [],
          })
        );
      } else {
        await act(() => setUser(null));
      }
    },
    []
  );

  return (
    <SessionTokenContext.Provider value={[user, !!token, setTokenAndGetMe]}>
      {children}
    </SessionTokenContext.Provider>
  );
});

const Head = ({ children }: PropsWithChildren) => (
  <div data-testid="fake-head">{children}</div>
);

const Script = ({ children, ...data }: PropsWithChildren<any>) => (
  <>
    {/* we use next/script, but also include <script /> tag for snapshots */}
    <NextScript {...data}>{children}</NextScript>
    <script
      data-testid="fake-script"
      {...data}
    >
      {children}
    </script>
  </>
);

export const WithWebsiteBuilderProvider = (
  props: ComponentProps<typeof WebsiteBuilderProvider>
) => (
  <WebsiteBuilderProvider
    Footer={TSRIFooter}
    Navbar={TsriV2Navbar}
    Article={TsriArticle}
    ArticleDate={TsriArticleDate}
    ArticleMeta={TsriArticleMeta}
    ArticleList={TsriArticleList}
    Author={TSRIAuthor}
    AuthorLinks={TSRIAuthorLinks}
    AuthorList={TSRIAuthorList}
    blocks={{
      BaseTeaser: TsriBaseTeaser,
      TeaserSlots: TsriBaseTeaserSlots,
      TeaserGridFlex: TsriBaseTeaserGridFlex,
      Break: TsriBreakBlock,
      Quote: TsriQuoteBlock,
      RichText: TsriRichText,
      Title: TsriTitleBlock,
      Renderer: TsriBlockRenderer,
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

export const WithWebsiteProviderDecorator = (Story: ComponentType) => {
  setDefaultOptions({
    locale: de,
  });

  initWePublishTranslator(deOverriden);
  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider
        Head={Head}
        Script={Script}
        Footer={TSRIFooter}
        Navbar={TsriV2Navbar}
        Article={TsriArticle}
        ArticleDate={TsriArticleDate}
        ArticleMeta={TsriArticleMeta}
        ArticleList={TsriArticleList}
        Author={TSRIAuthor}
        AuthorLinks={TSRIAuthorLinks}
        AuthorList={TSRIAuthorList}
        blocks={{
          BaseTeaser: TsriBaseTeaser,
          TeaserSlots: TsriBaseTeaserSlots,
          TeaserGridFlex: TsriBaseTeaserGridFlex,
          Break: TsriBreakBlock,
          Quote: TsriQuoteBlock,
          RichText: TsriRichText,
          Title: TsriTitleBlock,
          Renderer: TsriBlockRenderer,
        }}
        blockStyles={{
          ContextBox: TsriContextBox,
          TabbedContent,
        }}
        Banner={TsriBanner}
      >
        <SessionProvider>
          <CssBaseline />
          <style>
            {`
              html, body {
                &:has(nav > header) {
                  margin: 0 !important;
                  padding: 0 !important;
                }
              }

              #storybook-root {

                &:has( > nav > header) {
                  margin: 0!important;
                  padding: 0!important;
                  min-height: 120vh;
                }
              }

            `}
          </style>
          <Story />
        </SessionProvider>
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  );
};
