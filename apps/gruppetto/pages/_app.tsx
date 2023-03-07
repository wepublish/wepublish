import {AppProps} from 'next/app'
import Head from 'next/head'
import {WebsiteProvider} from '@wepublish/website'
import {createWithV1ApiClient} from '@wepublish/website/api'
import {NavigationContainer} from '@wepublish/navigation/website'
import {Container} from '@mui/material'
import {WebsiteBuilderProvider} from '@wepublish/website-builder'

function CustomApp({Component, pageProps}: AppProps) {
  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider Head={Head}>
        <Head>
          <title>Welcome to gruppetto!</title>
        </Head>

        <NavigationContainer />

        <Container component="main">
          <Component {...pageProps} />
        </Container>
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  )
}

export default createWithV1ApiClient(process.env.API_URL)(CustomApp)
