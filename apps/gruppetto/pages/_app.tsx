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
import {GoogleAnalytics} from '@next/third-parties/google'
import {theme} from '@wepublish/ui'
import {authLink, NextWepublishLink, SessionProvider} from '@wepublish/utils/website'
import {
  ApiV1,
  FooterContainer,
  NavbarContainer,
  WebsiteBuilderProvider,
  WebsiteProvider
} from '@wepublish/website'
import {setDefaultOptions} from 'date-fns'
import {de} from 'date-fns/locale'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {AppProps} from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import Script from 'next/script'
import {initReactI18next} from 'react-i18next'
import {PartialDeep} from 'type-fest'
import {z} from 'zod'
import {zodI18nMap} from 'zod-i18n-map'
import translation from 'zod-i18n-map/locales/de/zod.json'

import background from '../src/background.svg'
import {GruppettoBreakBlock} from '../src/break-block'
import {Footer} from '../src/footer'
import {ReactComponent as Logo} from '../src/logo.svg'
import {YearlyMemberPlanItem} from '../src/yearly-memberplan-item'
import {EmotionCache} from '@emotion/cache'

setDefaultOptions({
  locale: de
})

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de'],
    resources: {
      de: {zod: translation}
    }
  })
z.setErrorMap(zodI18nMap)

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
  background: url(${background.src});
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

const FooterInnerWrapper = styled('div')`
  width: 200px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({theme}) => theme.spacing(2)};
`

const FooterLogoLink = styled(NextWepublishLink)`
  grid-column-start: 1;
  grid-column-end: 4;
  display: grid;
  grid-template-columns: 1fr;
`

const SocialLink = styled(NextWepublishLink)`
  display: grid;
  grid-template-columns: 32px;
  justify-content: center;
`

const NavBar = styled(NavbarContainer)`
  grid-column: -1/1;
  z-index: 11;
`

type CustomAppProps = AppProps<{
  sessionToken?: ApiV1.UserSession
}> & {emotionCache?: EmotionCache}

const {publicRuntimeConfig} = getConfig()

function CustomApp({Component, pageProps, emotionCache}: CustomAppProps) {
  const siteTitle = 'Gruppetto - Das neue Schweizer Radsportmagazin'

  return (
    <SessionProvider sessionToken={pageProps.sessionToken ?? null}>
      <WebsiteProvider>
        <WebsiteBuilderProvider
          meta={{siteTitle}}
          Head={Head}
          Script={Script}
          Footer={Footer}
          MemberPlanItem={YearlyMemberPlanItem}
          elements={{Link: NextWepublishLink}}
          blocks={{Break: GruppettoBreakBlock}}>
          <ThemeProvider theme={gruppettoTheme}>
            <CssBaseline />

            <Head>
              <title key="title">{siteTitle}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />

              {/* Feeds */}
              <link rel="alternate" type="application/rss+xml" href="/api/rss-feed" />
              <link rel="alternate" type="application/atom+xml" href="/api/atom-feed" />
              <link rel="alternate" type="application/feed+json" href="/api/json-feed" />

              {/* Sitemap */}
              <link rel="sitemap" type="application/xml" title="Sitemap" href="/api/sitemap" />
            </Head>

            <Spacer>
              <NavBar
                categorySlugs={[['account', 'issues', 'about-us']]}
                slug="main"
                headerSlug="header"
              />

              <main>
                <MainSpacer maxWidth="lg">
                  <Component {...pageProps} />
                </MainSpacer>
              </main>

              <FooterContainer slug="footer" categorySlugs={[[]]}>
                <FooterInnerWrapper>
                  <FooterLogoLink href="/">
                    <Logo />
                  </FooterLogoLink>

                  <SocialLink href="https://www.instagram.com/gruppettomag/">
                    <svg viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M0 16.9697C0 25.8063 7.16344 32.9697 16 32.9697C24.8366 32.9697 32 25.8063 32 16.9697C32 8.13317 24.8366 0.969727 16 0.969727C7.16344 0.969727 0 8.13317 0 16.9697Z"
                        fill="#F084AD"
                      />
                      <path
                        d="M16 10.1699C18.2 10.1699 18.5 10.1699 19.4 10.1699C20.2 10.1699 20.6 10.3699 20.9 10.4699C21.3 10.6699 21.6 10.7699 21.9 11.0699C22.2 11.3699 22.4 11.6699 22.5 12.0699C22.6 12.3699 22.7 12.7699 22.8 13.5699C22.8 14.4699 22.8 14.6699 22.8 16.9699C22.8 19.2699 22.8 19.4699 22.8 20.3699C22.8 21.1699 22.6 21.5699 22.5 21.8699C22.3 22.2699 22.2 22.5699 21.9 22.8699C21.6 23.1699 21.3 23.3699 20.9 23.4699C20.6 23.5699 20.2 23.6699 19.4 23.7699C18.5 23.7699 18.3 23.7699 16 23.7699C13.7 23.7699 13.5 23.7699 12.6 23.7699C11.8 23.7699 11.4 23.5699 11.1 23.4699C10.7 23.2699 10.4 23.1699 10.1 22.8699C9.79995 22.5699 9.59995 22.2699 9.49995 21.8699C9.39995 21.5699 9.29995 21.1699 9.19995 20.3699C9.19995 19.4699 9.19995 19.2699 9.19995 16.9699C9.19995 14.6699 9.19995 14.4699 9.19995 13.5699C9.19995 12.7699 9.39995 12.3699 9.49995 12.0699C9.69995 11.6699 9.79995 11.3699 10.1 11.0699C10.4 10.7699 10.7 10.5699 11.1 10.4699C11.4 10.3699 11.8 10.2699 12.6 10.1699C13.5 10.1699 13.8 10.1699 16 10.1699ZM16 8.66992C13.7 8.66992 13.5 8.66992 12.6 8.66992C11.7 8.66992 11.1 8.86992 10.6 9.06992C10.1 9.26992 9.59995 9.56992 9.09995 10.0699C8.59995 10.5699 8.39995 10.9699 8.09995 11.5699C7.89995 12.0699 7.79995 12.6699 7.69995 13.5699C7.69995 14.4699 7.69995 14.7699 7.69995 16.9699C7.69995 19.2699 7.69995 19.4699 7.69995 20.3699C7.69995 21.2699 7.89995 21.8699 8.09995 22.3699C8.29995 22.8699 8.59995 23.3699 9.09995 23.8699C9.59995 24.3699 9.99995 24.5699 10.6 24.8699C11.1 25.0699 11.7 25.1699 12.6 25.2699C13.5 25.2699 13.8 25.2699 16 25.2699C18.2 25.2699 18.5 25.2699 19.4 25.2699C20.3 25.2699 20.9 25.0699 21.4 24.8699C21.9 24.6699 22.4 24.3699 22.9 23.8699C23.4 23.3699 23.6 22.9699 23.9 22.3699C24.1 21.8699 24.1999 21.2699 24.2999 20.3699C24.2999 19.4699 24.2999 19.1699 24.2999 16.9699C24.2999 14.7699 24.2999 14.4699 24.2999 13.5699C24.2999 12.6699 24.1 12.0699 23.9 11.5699C23.7 11.0699 23.4 10.5699 22.9 10.0699C22.4 9.56992 22 9.36992 21.4 9.06992C20.9 8.86992 20.3 8.76992 19.4 8.66992C18.5 8.66992 18.3 8.66992 16 8.66992Z"
                        fill="white"
                      />
                      <path
                        d="M16 12.6699C13.6 12.6699 11.7 14.5699 11.7 16.9699C11.7 19.3699 13.6 21.2699 16 21.2699C18.4 21.2699 20.3 19.3699 20.3 16.9699C20.3 14.5699 18.4 12.6699 16 12.6699ZM16 19.7699C14.5 19.7699 13.2 18.5699 13.2 16.9699C13.2 15.4699 14.4 14.1699 16 14.1699C17.5 14.1699 18.8 15.3699 18.8 16.9699C18.8 18.4699 17.5 19.7699 16 19.7699Z"
                        fill="white"
                      />
                      <path
                        d="M20.4 13.5699C20.9522 13.5699 21.4 13.1222 21.4 12.5699C21.4 12.0176 20.9522 11.5699 20.4 11.5699C19.8477 11.5699 19.4 12.0176 19.4 12.5699C19.4 13.1222 19.8477 13.5699 20.4 13.5699Z"
                        fill="white"
                      />
                    </svg>
                  </SocialLink>

                  <SocialLink href="https://twitter.com/GruppettoMag">
                    <svg viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0 16.9697C0 8.13317 7.16344 0.969727 16 0.969727C24.8366 0.969727 32 8.13317 32 16.9697C32 25.8063 24.8366 32.9697 16 32.9697C7.16344 32.9697 0 25.8063 0 16.9697ZM22.1 12.4697C22.8 12.3697 23.4 12.2697 24 11.9697C23.6 12.6697 23 13.2697 22.3 13.6697C22.5 18.3697 19.1 23.4697 13 23.4697C11.2 23.4697 9.5 22.8697 8 21.9697C9.7 22.1697 11.5 21.6697 12.7 20.7697C11.2 20.7697 10 19.7697 9.6 18.4697C10.1 18.5697 10.6 18.4697 11.1 18.3697C9.6 17.9697 8.5 16.5697 8.5 15.0697C9 15.2697 9.5 15.4697 10 15.4697C8.6 14.4697 8.1 12.5697 9 11.0697C10.7 13.0697 13.1 14.3697 15.8 14.4697C15.3 12.4697 16.9 10.4697 19 10.4697C19.9 10.4697 20.8 10.8697 21.4 11.4697C22.2 11.2697 22.9 11.0697 23.5 10.6697C23.3 11.4697 22.8 12.0697 22.1 12.4697Z"
                        fill="#F084AD"
                      />
                    </svg>
                  </SocialLink>

                  <SocialLink href="https://www.strava.com/clubs/1095563">
                    <svg viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect y="0.969727" width="32" height="32" rx="16" fill="#F084AD" />
                      <path
                        d="M19.1739 22.4184L17.2164 18.6454H14.3441L19.1739 27.9697L24 18.6454H21.1269M14.5597 13.513L17.2173 18.6445H21.1269L14.5597 5.96973L8 18.6454H11.9068"
                        fill="white"
                      />
                    </svg>
                  </SocialLink>
                </FooterInnerWrapper>
              </FooterContainer>
            </Spacer>

            {publicRuntimeConfig.env.GA_ID && (
              <GoogleAnalytics gaId={publicRuntimeConfig.env.GA_ID} />
            )}

            <Script
              src={publicRuntimeConfig.env.API_URL! + '/scripts/head.js'}
              strategy="afterInteractive"
            />
            <Script
              src={publicRuntimeConfig.env.API_URL! + '/scripts/body.js'}
              strategy="lazyOnload"
            />
          </ThemeProvider>
        </WebsiteBuilderProvider>
      </WebsiteProvider>
    </SessionProvider>
  )
}

const ConnectedApp = ApiV1.createWithV1ApiClient(publicRuntimeConfig.env.API_URL!, [authLink])(
  CustomApp
)

export {ConnectedApp as default}
