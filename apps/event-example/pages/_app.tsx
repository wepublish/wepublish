import {AppProps} from 'next/app'
import Head from 'next/head'
import './styles.css'
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client'
import {createUploadLink} from 'apollo-upload-client'
import {Container, CssBaseline, GlobalStyles, ThemeProvider} from '@mui/material'
import {Header} from '../src/header'
import {theme} from '../src/theme'
import {Footer} from '../src/footer'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns'
import {LocalizationProvider} from '@mui/x-date-pickers'
import {css} from '@emotion/react'

console.log(process.env.NODE_ENV)

const aPIURL =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:4000/v1`
    : `https://api.eventdemo.wepublish.dev/v1`

const mainLink = createUploadLink({uri: aPIURL})

const client = new ApolloClient({
  link: mainLink,
  cache: new InMemoryCache({})
})

function CustomApp({Component, pageProps}: AppProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={theme}>
        <ApolloProvider client={client}>
          <CssBaseline />

          <GlobalStyles
            styles={css`
              body {
                font-family: Arial, sans-serif;
              }

              a {
                color: rgb(169, 119, 163);
              }
            `}
          />

          <Head>
            <title>Welcome to event-example!</title>
          </Head>

          <Header
            sections={[
              {url: '/', title: 'Lokales'},
              {url: '/', title: 'Politik'},
              {url: '/', title: 'Wetter'},
              {url: '/', title: 'Kultur'},
              {url: '/events', title: 'Kultur Kalender'}
            ]}
          />

          <Container maxWidth="lg">
            <main className="app">
              <Component {...pageProps} />
            </main>
          </Container>

          <Footer />
        </ApolloProvider>
      </ThemeProvider>
    </LocalizationProvider>
  )
}

export default CustomApp
