import { DocumentContext } from 'next/document';
import {
  FontStyle,
  FontWeight,
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

const fontWeightToNumber: Record<FontWeight, number> = {
  [FontWeight.Thin]: 100,
  [FontWeight.ExtraLight]: 200,
  [FontWeight.Light]: 300,
  [FontWeight.Regular]: 400,
  [FontWeight.Medium]: 500,
  [FontWeight.SemiBold]: 600,
  [FontWeight.Bold]: 700,
  [FontWeight.ExtraBold]: 800,
  [FontWeight.Black]: 900,
  [FontWeight.Variable]: 400, // dont care about variable here
};

export const DocumentHeadTags = (props: DocumentProps) => {
  const fonts =
    props.websiteSettings?.fonts.flatMap(font => {
      if (!font.name) {
        return [];
      }

      const fontName = font.name.replace(/ /g, '+');
      const supportsItalic = font.style.includes(FontStyle.Italic);
      const weights = new Set(
        font.weight.map(weight => fontWeightToNumber[weight])
      );
      const weightStr = Array.from(
        weights.values(),
        weight => `0,${weight}`
      ).join(';');
      const italicStr =
        supportsItalic ? `;${weightStr.replace(/0,/g, '1,')}` : '';

      return `family=${fontName}:ital,wght@${weightStr}${italicStr}`;
    }) ?? [];

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
    </>
  );
};

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
              apiUrl={process.env.API_URL}
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
      apiUrl: process.env.API_URL,
    },
  };
};
