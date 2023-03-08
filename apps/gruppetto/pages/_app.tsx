import {AppProps} from 'next/app'
import Head from 'next/head'
import {WebsiteProvider} from '@wepublish/website'
import {createWithV1ApiClient} from '@wepublish/website/api'
import {Container, createTheme, CssBaseline, ThemeProvider, styled} from '@mui/material'
import {WebsiteBuilderProvider} from '@wepublish/website-builder'
import {Header} from '../src/header'
import {FooterContainer} from '@wepublish/navigation/website'
import {Logo} from '../src/logo'
import {theme} from '@wepublish/ui'

const gruppettoTheme = createTheme(theme, {
  palette: {
    primary: {
      main: '#F084AD'
    },
    background: {
      default: '#E9E9E9'
    }
  }
})

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({theme}) => theme.spacing(3)};
  min-height: 100vh;
`

function CustomApp({Component, pageProps}: AppProps) {
  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider Head={Head}>
        <ThemeProvider theme={gruppettoTheme}>
          <CssBaseline />

          <Head>
            <title>Welcome to gruppetto!</title>
          </Head>

          <Spacer>
            <Header />

            <Container component="main">
              <Component {...pageProps} />
            </Container>

            <FooterContainer slug="footer">
              <Logo />
            </FooterContainer>
          </Spacer>
        </ThemeProvider>
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  )
}

export default createWithV1ApiClient(process.env.API_URL)(CustomApp)
