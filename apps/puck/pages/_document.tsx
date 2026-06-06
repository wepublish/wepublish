import { DocumentHeadTags, DocumentProps } from '@wepublish/utils/website';
import { Head, Html, Main, NextScript } from 'next/document';

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
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
        />
        <link
          rel="mask-icon"
          href="/safari-pinned-tab.svg"
          color="#000000"
        />
        <meta
          name="msapplication-TileColor"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          content="#ffffff"
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

// Document.getInitialProps = async (ctx: DocumentContext) => {
//   const { props } = await documentGetInitialProps(ctx);

//   return props;
// };
