import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentProps,
} from '@wepublish/utils/website';
import { DocumentContext, Head, Html, Main, NextScript } from 'next/document';

// The live site's stylesheets (byte-identical) and the subscribe form's
// additions, in one cascade layer: their order among each other stays as in
// the legacy clone, and the unlayered emotion/MUI styles of the we.publish
// components (login, signup, profile) win over them. Loaded by the browser
// rather than bundled, as Next's css-loader drops the `layer()` of @import.
const LEGACY_STYLES = [
  '/static/css/live-global.css',
  '/static/css/live-modules.css',
  '/static/css/subscribe-form.css',
]
  .map(href => `@import url('${href}') layer(legacy);`)
  .join('\n');

export default function Document(props: DocumentProps) {
  return (
    <Html lang="de">
      <Head>
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
          content="Neue Wege"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
        />

        <style
          id="legacy-styles"
          dangerouslySetInnerHTML={{ __html: LEGACY_STYLES }}
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
