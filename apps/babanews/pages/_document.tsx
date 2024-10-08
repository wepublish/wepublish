import {
  documentGetInitialProps,
  DocumentHeadTags,
  DocumentHeadTagsProps
} from '@mui/material-nextjs/v13-pagesRouter'
import {DocumentContext, Head, Html, Main, NextScript} from 'next/document'

export default function MuiDocument(props: DocumentHeadTagsProps) {
  // console.log(props)

  console.log(Object.keys(props))

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
