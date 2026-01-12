/* eslint-disable react/display-name */
import { ThemeProvider } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { act } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { initWePublishTranslator } from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import {
  SensitiveDataUser,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
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
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

import deOverriden from '../../locales/deOverriden.json';
import { TsriTabbedContent } from '../components/block-layouts/tsri-base-tabbed-content';
import { TsriBaseTeaserGridFlex } from '../components/teaser-layouts/tsri-base-teaser-flex-grid';
import { TsriBaseTeaserSlots } from '../components/teaser-layouts/tsri-base-teaser-slots';
import { TsriBaseTeaser } from '../components/teasers/tsri-base-teaser';
import { TsriArticle } from '../components/tsri-article';
import { TsriArticleDate } from '../components/tsri-article-date';
import { TsriArticleList } from '../components/tsri-article-list';
import { TsriArticleMeta } from '../components/tsri-article-meta';
import { TsriAuthor } from '../components/tsri-author';
import { TsriAuthorLinks } from '../components/tsri-author-links';
import { TsriAuthorList } from '../components/tsri-author-list';
import { TsriBanner } from '../components/tsri-banner';
import { TsriBlockRenderer } from '../components/tsri-block-renderer';
import { TsriBreakBlock } from '../components/break-blocks/tsri-attention-catcher';
import { TsriContextBox } from '../components/break-blocks/tsri-context-box';
import { TsriFooter } from '../components/tsri-footer';
import { TsriQuoteBlock } from '../components/tsri-quote-block';
import { TsriRichText } from '../components/tsri-richtext';
import { TsriTitleBlock } from '../components/tsri-title-block';
import { TsriV2Navbar } from '../components/tsri-v2-navbar';
import theme from '../theme';

const SessionProvider = memo<PropsWithChildren>(({ children }) => {
  const [token, setToken] = useState<SessionWithTokenWithoutUser | null>();
  const [user, setUser] = useState<SensitiveDataUser | null>(null);

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
            active: true,
            roleIDs: [],
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
    Footer={TsriFooter}
    Navbar={TsriV2Navbar}
    Article={TsriArticle}
    ArticleDate={TsriArticleDate}
    ArticleMeta={TsriArticleMeta}
    ArticleList={TsriArticleList}
    Author={TsriAuthor}
    AuthorLinks={TsriAuthorLinks}
    AuthorList={TsriAuthorList}
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
      TabbedContent: TsriTabbedContent,
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
  z.setErrorMap(zodI18nMap);

  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider
        Head={Head}
        Script={Script}
        Footer={TsriFooter}
        Navbar={TsriV2Navbar}
        Article={TsriArticle}
        ArticleDate={TsriArticleDate}
        ArticleMeta={TsriArticleMeta}
        ArticleList={TsriArticleList}
        Author={TsriAuthor}
        AuthorLinks={TsriAuthorLinks}
        AuthorList={TsriAuthorList}
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
          TabbedContent: TsriTabbedContent,
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
