import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from '@mui/material-nextjs/v15-pagesRouter';
import { captureException } from '@sentry/react';
import { getApiUrl, withDocumentToken } from '@wepublish/utils/website';
import { Head, Html, Main, NextScript } from 'next/document';

type MuiDocumentProps = DocumentHeadTagsProps & {
  themeValues: Record<string, unknown> | null;
};

export default function MuiDocument({
  themeValues,
  ...props
}: MuiDocumentProps) {
  return (
    <Html lang="de">
      <Head>
        <DocumentHeadTags {...props} />

        {themeValues && (
          <script
            id="theme-values"
            type="application/json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(themeValues) }}
          />
        )}
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

const apiUrl = getApiUrl();

MuiDocument.getInitialProps = withDocumentToken(async (ctx, token) => {
  const finalProps = await documentGetInitialProps(ctx);
  let themeValues: Record<string, unknown> | null = null;

  const headers: HeadersInit =
    token ? { Authorization: `Bearer ${token}` } : {};

  const dataResponses = await Promise.allSettled([
    fetch(`${apiUrl}/v1/theme`, { headers }),
  ]);

  const [themeRes] = dataResponses;

  if (themeRes.status === 'fulfilled' && themeRes.value.ok) {
    themeValues = await themeRes.value.json();
  }

  for (const response of dataResponses) {
    if (response.status === 'rejected') {
      captureException(response.reason);
    }
  }

  return { ...finalProps, themeValues };
});
