import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps,
} from '@mui/material-nextjs/v15-pagesRouter';
import { DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function MuiDocument(props: DocumentHeadTagsProps) {
  return (
    <Html lang="de">
      <Head>
        <DocumentHeadTags {...props} />

        <Script
          type="text/javascript"
          src="https://cdn.consentmanager.net/delivery/autoblocking/ee45badb726a6.js"
          data-cmp-host="b.delivery.consentmanager.net"
          data-cmp-cdn="cdn.consentmanager.net"
          data-cmp-codesrc="0"
          strategy="beforeInteractive"
        ></Script>
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
  return finalProps;
};
