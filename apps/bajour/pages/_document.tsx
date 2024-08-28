import {
  DocumentHeadTags,
  DocumentHeadTagsProps,
  documentGetInitialProps
} from '@mui/material-nextjs/v13-pagesRouter'
import {Html, Head, Main, NextScript, DocumentContext} from 'next/document'

export default function MuiDocument(props: DocumentHeadTagsProps) {
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
  )
}

MuiDocument.getInitialProps = async (ctx: DocumentContext) => {
  const finalProps = await documentGetInitialProps(ctx)
  return finalProps
}
