import {AppProps} from 'next/app'
import Head from 'next/head'
import {WebsiteProvider} from '@wepublish/website'
import {createWithV1ApiClient} from '@wepublish/website/api'
import {NavigationContainer} from '@wepublish/navigation/website'
import {Container} from '@mui/material'

function CustomApp({Component, pageProps}: AppProps) {
  return (
    <WebsiteProvider>
      <Head>
        <title>Welcome to grupetto!</title>
      </Head>

      <NavigationContainer />

      <Container component={'main'}>
        <Component {...pageProps} />
      </Container>
    </WebsiteProvider>
  )
}

export default createWithV1ApiClient(process.env.API_URL)(CustomApp)
