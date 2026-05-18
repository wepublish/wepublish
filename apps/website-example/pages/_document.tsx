import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from '@mui/material-nextjs/v15-pagesRouter';
import { getApiUrl } from '@wepublish/utils/website';
import { DocumentContext, Head, Html, Main, NextScript } from 'next/document';

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

MuiDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx);

  const apiUrl = getApiUrl();
  let themeValues: Record<string, unknown> | null = null;

  try {
    const response = await fetch(`${apiUrl}/v1/theme`);

    if (response.ok) {
      themeValues = await response.json();
    }
  } catch {
    // theme values are optional, continue without them
  }

  return { ...finalProps, themeValues };
};
