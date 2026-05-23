import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentProps,
} from '@wepublish/utils/website';
import { DocumentContext, Head, Html, Main, NextScript } from 'next/document';

export default function Document(props: DocumentProps) {
  return (
    <Html lang="de">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        {/* Feeds */}
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/api/rss-feed"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/api/atom-feed"
        />
        <link
          rel="alternate"
          type="application/feed+json"
          href="/api/json-feed"
        />

        {/* Sitemap */}
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/api/sitemap"
        />

        {/* Favicon definitions, generated with https://realfavicongenerator.net/ */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon.svg"
        />
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="WNTI"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
        />

        <DocumentHeadTags {...props} />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  const { props } = await documentGetInitialProps(ctx);

  return props;
};
