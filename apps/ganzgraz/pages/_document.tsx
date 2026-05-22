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
