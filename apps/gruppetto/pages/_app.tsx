import {
  Container,
  createTheme,
  css,
  CssBaseline,
  styled,
  Theme,
  ThemeOptions,
  ThemeProvider
} from '@mui/material'
import {FooterContainer} from '@wepublish/navigation/website'
import {Link as BuilderLink, theme} from '@wepublish/ui'
import {WebsiteProvider} from '@wepublish/website'
import {BuilderLinkProps, WebsiteBuilderProvider} from '@wepublish/website-builder'
import {createWithV1ApiClient} from '@wepublish/website/api'
import {AppProps} from 'next/app'
import Head from 'next/head'
import Link from 'next/link'
import {PartialDeep} from 'type-fest'
import {Button} from '../src/button'
import {Header} from '../src/header'
import {Logo} from '../src/logo'
import test from '../src/test.svg'

const gruppettoTheme = createTheme(theme, {
  palette: {
    primary: {
      main: '#F084AD',
      dark: '#BC4D77'
    },
    background: {
      default: '#FFFAFC'
    }
  },
  shape: {
    borderRadius: 3
  }
} as PartialDeep<Theme> | ThemeOptions)

const Spacer = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-rows: min-content 1fr min-content;
  gap: ${({theme}) => theme.spacing(3)};
  min-height: 100vh;
  background: url(${test.src});
  background-repeat: repeat-y;
  background-size: cover;
`

const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`

const NextLink = ({children, href, ...props}: BuilderLinkProps) => {
  const hrefWithoutOrigin = href?.replace(location.origin, '') ?? ''

  return (
    <Link href={hrefWithoutOrigin} as={hrefWithoutOrigin} passHref legacyBehavior>
      <BuilderLink {...props}>{children}</BuilderLink>
    </Link>
  )
}

const FooterLogo = styled(Logo)`
  width: 150px;
`

function CustomApp({Component, pageProps}: AppProps) {
  return (
    <WebsiteProvider>
      <WebsiteBuilderProvider Head={Head} elements={{Link: NextLink, Button}}>
        <ThemeProvider theme={gruppettoTheme}>
          <CssBaseline />

          <Head>
            <title>Welcome to gruppetto!</title>
          </Head>

          <Spacer>
            <Header />

            <main>
              <MainSpacer>
                <Component {...pageProps} />
              </MainSpacer>
            </main>

            <FooterContainer slug="footer">
              <FooterLogo />
            </FooterContainer>
          </Spacer>
        </ThemeProvider>
      </WebsiteBuilderProvider>
    </WebsiteProvider>
  )
}

export default createWithV1ApiClient(process.env.API_URL!)(CustomApp)
