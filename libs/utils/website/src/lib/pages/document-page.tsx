import { NormalizedCacheObject } from '@apollo/client';
import { DocumentContext } from 'next/document';
import {
  PublicEnv,
  WebsiteSettingsDocument,
  WebsiteSettingsFragment,
  getApiClient,
} from '@wepublish/website/api';
import {
  DocumentHeadTagsProps,
  documentGetInitialProps as muiDocumentGetInitialProps,
  DocumentHeadTags as MuiDocumentHeadTags,
} from '@mui/material-nextjs/v15-pagesRouter';
import { getApiUrl } from '../api-url';
import { websiteSettingsFontFamilies } from '../website-fonts';
// Side-effect import: brings the `Window.WEBSITE_SETTINGS` augmentation into
// scope for the two inline scripts below. It lives in the neutral core so
// non-Next shells get it too.
import '../website-globals';

export type DocumentProps = DocumentHeadTagsProps & {
  websiteSettings: WebsiteSettingsFragment | undefined;
  publicEnv: PublicEnv;
};

export const DocumentHeadTags = (props: DocumentProps) => {
  const fonts = websiteSettingsFontFamilies(props.websiteSettings);

  return (
    <>
      {!!fonts.length && (
        <>
          <link
            rel="preconnect"
            href="https://fonts.googleapis.com"
          />

          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin={'anonymous'}
          />

          <link
            href={`https://fonts.googleapis.com/css2?${fonts.join('&')}&display=swap`}
            rel="stylesheet"
          />
        </>
      )}

      <MuiDocumentHeadTags {...props} />

      <script
        dangerouslySetInnerHTML={{
          __html: `window.WEBSITE_SETTINGS = ${JSON.stringify(props.websiteSettings)}`,
        }}
      />

      <script
        dangerouslySetInnerHTML={{
          __html: `window.PUBLIC_ENV = ${JSON.stringify(props.publicEnv)}`,
        }}
      />
    </>
  );
};

export const documentGetInitialProps = async (
  ctx: DocumentContext,
  getPublicEnv?: () => object
) => {
  const client = getApiClient(getApiUrl(), []);
  await client.query({ query: WebsiteSettingsDocument });
  const publicEnv: PublicEnv = {
    apiUrl: process.env.API_URL ?? '',
    ...(getPublicEnv?.() ?? {}),
  };

  const websiteSettings = (client.cache.extract() as NormalizedCacheObject)[
    'ROOT_QUERY'
  ]?.['websiteSettings'] as WebsiteSettingsFragment | undefined;

  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = options => {
    const opts =
      typeof options === 'function' ?
        { enhanceComponent: options }
      : (options ?? {});

    return originalRenderPage({
      ...opts,
      enhanceApp: App => {
        const Enhanced = opts.enhanceApp ? opts.enhanceApp(App) : App;

        return function AppWithSettings(props) {
          const appProps = { ...props, websiteSettings, publicEnv };

          return <Enhanced {...appProps} />;
        } as typeof App;
      },
    });
  };

  const finalProps = await muiDocumentGetInitialProps(ctx);

  return {
    client,
    props: {
      ...finalProps,
      websiteSettings,
      publicEnv,
    },
  };
};
