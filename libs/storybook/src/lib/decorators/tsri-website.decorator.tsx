import NextScript from 'next/script';
import { CssBaseline } from '@mui/material';
import {
  ComponentType,
  PropsWithChildren,
  memo,
  useCallback,
  useState,
} from 'react';
import { User, SessionWithTokenWithoutUser } from '@wepublish/website/api';
import { SessionTokenContext } from '@wepublish/authentication/website';

import { ThemeProvider } from '@mui/material';
import { PaymentAmountPicker } from '@wepublish/membership/website';
import { NextWepublishLink } from '@wepublish/utils/website';
import { WebsiteProvider } from '@wepublish/website';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';

import { MitmachenInner } from '../../../../../apps/tsri/pages/mitmachen';
import { TabbedContent } from '../../../../../apps/tsri/src/block-styles/tsri-tabbed-content';
import { TsriArticleDate } from '../../../../../apps/tsri/src/components/tsri-article-date';
import { TsriArticleMeta } from '../../../../../apps/tsri/src/components/tsri-article-meta';
import { TsriBanner } from '../../../../../apps/tsri/src/components/tsri-banner';
import { TsriBaseTeaser } from '../../../../../apps/tsri/src/components/tsri-base-teaser';
import { TsriBreakBlock } from '../../../../../apps/tsri/src/components/tsri-break-block';
import { TsriContextBox } from '../../../../../apps/tsri/src/components/tsri-context-box';
import { TsriQuoteBlock } from '../../../../../apps/tsri/src/components/tsri-quote-block';
import { TsriRichText } from '../../../../../apps/tsri/src/components/tsri-richtext';
import { TsriTeaserGridFlex } from '../../../../../apps/tsri/src/components/tsri-teaser-grid-flex';
import { TsriV2Navbar } from '../../../../../apps/tsri/src/components/tsri-v2-navbar';
import theme from '../../../../../apps/tsri/src/theme';

const SessionProvider = memo<PropsWithChildren>(({ children }) => {
  const [token, setToken] = useState<SessionWithTokenWithoutUser | null>();
  const [user, setUser] = useState<User | null>(null);

  const setTokenAndGetMe = useCallback(
    async (newToken: SessionWithTokenWithoutUser | null) => {
      setToken(newToken);

      if (newToken) {
        setUser({
          id: '1234-1234',
          firstName: 'Foo',
          name: 'Bar',
          email: 'foobar@example.com',
          paymentProviderCustomers: [],
          properties: [],
          permissions: [],
        });
      } else {
        setUser(null);
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

export const WithWebsiteProviderDecorator = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider
      Head={Head}
      Script={Script}
      Navbar={TsriV2Navbar}
      ArticleDate={TsriArticleDate}
      ArticleMeta={TsriArticleMeta}
      PaymentAmount={PaymentAmountPicker}
      elements={{ Link: NextWepublishLink }}
      blocks={{
        BaseTeaser: TsriBaseTeaser,
        TeaserGridFlex: TsriTeaserGridFlex,
        Break: TsriBreakBlock,
        Quote: TsriQuoteBlock,
        RichText: TsriRichText,
        Subscribe: MitmachenInner,
      }}
      blockStyles={{
        ContextBox: TsriContextBox,
        TabbedContent,
      }}
      Banner={TsriBanner}
    >
      <ThemeProvider theme={theme}>
        <SessionProvider>
          <CssBaseline />
          <Story />
        </SessionProvider>
      </ThemeProvider>
    </WebsiteBuilderProvider>
  </WebsiteProvider>
);
