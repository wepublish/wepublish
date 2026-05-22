import { DocumentContext } from 'next/document';
import {
  WebsiteSettingsDocument,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';
import { getApiClient } from '@wepublish/website/api';
import {
  DocumentHeadTagsProps,
  documentGetInitialProps as muiDocumentGetInitialProps,
  DocumentHeadTags as MuiDocumentHeadTags,
} from '@mui/material-nextjs/v15-pagesRouter';
import { getApiUrl } from '../api-url';

declare global {
  interface Window {
    WEBSITE_SETTINGS: WebsiteSettingsFragment | undefined;
  }
}

export type DocumentProps = DocumentHeadTagsProps & {
  websiteSettings: WebsiteSettingsFragment | undefined;
};

export const DocumentHeadTags = (props: DocumentProps) => (
  <>
    <MuiDocumentHeadTags {...props} />

    <script
      dangerouslySetInnerHTML={{
        __html: `window.WEBSITE_SETTINGS = ${JSON.stringify(props.websiteSettings)}`,
      }}
    />
  </>
);

export const documentGetInitialProps = async (ctx: DocumentContext) => {
  const client = getApiClient(getApiUrl(), []);
  await client.query({ query: WebsiteSettingsDocument });

  const websiteSettings = client.cache.extract()['ROOT_QUERY']?.[
    'websiteSettings'
  ] as WebsiteSettingsFragment | undefined;

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

  const finalProps = await muiDocumentGetInitialProps(ctx);

  return {
    client,
    props: {
      ...finalProps,
      websiteSettings,
    },
  };
};
