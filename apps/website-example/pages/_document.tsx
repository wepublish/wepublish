import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from '@mui/material-nextjs/v15-pagesRouter';
import { getApiUrl } from '@wepublish/utils/website';
import {
  getApiClient,
  WebsiteSettings,
  WebsiteSettingsDocument,
} from '@wepublish/website/api';
import { DocumentContext, Head, Html, Main, NextScript } from 'next/document';

type DocumentProps = DocumentHeadTagsProps & {
  websiteSettings: WebsiteSettings;
};

export default function MuiDocument(props: DocumentProps) {
  return (
    <Html lang="de">
      <Head>
        <DocumentHeadTags {...props} />

        <script
          dangerouslySetInnerHTML={{
            __html: `window.WEBSITE_SETTINGS = ${JSON.stringify(props.websiteSettings)}`,
          }}
        />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MuiDocument.getInitialProps = async (ctx: DocumentContext) => {
  const client = getApiClient(getApiUrl(), []);
  await client.query({
    query: WebsiteSettingsDocument,
  });
  const websiteSettings = client.cache.extract()['ROOT_QUERY']?.[
    'websiteSettings'
  ] as WebsiteSettings;

  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = options => {
    const opts =
      typeof options === 'function' ? { enhanceApp: options } : (options ?? {});

    return originalRenderPage({
      ...opts,
      enhanceApp: App => {
        const Enhanced = opts.enhanceApp ? opts.enhanceApp(App as any) : App;

        return function AppWithSettings(props) {
          return (
            <Enhanced
              {...(props as any)}
              websiteSettings={websiteSettings}
            />
          );
        } as typeof App;
      },
    });
  };

  const finalProps = await documentGetInitialProps(ctx);

  return {
    ...finalProps,
    websiteSettings,
  };
};
