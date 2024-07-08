import {
  Backdrop,
  Card,
  CardActions,
  CardContent,
  Modal,
  styled,
  SxProps,
  Theme
} from '@mui/material'
import {ApiV1, useUser, useWebsiteBuilder} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useRef, useState} from 'react'

export type CookieOrPayProps = {
  onCookie?: () => void
  onPay?: () => void
}

export const CookieOrPayKey = 'cookieOrPay.accept-cookies' as const

export const CookieOrPayWrapper = styled('div')`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-auto-columns: minmax(0, 800px);
  grid-auto-rows: min-content;
  justify-content: center;
  justify-items: center;
  align-items: start;
  gap: ${({theme}) => theme.spacing(6)};
  justify-items: center;
  outline: none;
  overflow-y: auto;
  padding: ${({theme}) => theme.spacing(2)};
`

export const CookieOrPayConsents = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  align-items: start;
  gap: ${({theme}) => theme.spacing(3)};
`

export const acceptCookiesStyles: SxProps<Theme> = theme => ({
  background: theme.palette.accent.main,
  color: theme.palette.accent.contrastText
})

export const CookieOrPayBackdrop = styled(Backdrop)`
  background-color: rgba(0, 0, 0, 0.9);
`

export const CookieOrPayText = styled('div')`
  color: ${({theme}) => theme.palette.getContrastText(theme.palette.common.black)};
`

export const CookieOrPay = ({onPay, onCookie}: CookieOrPayProps) => {
  const {hasUser} = useUser()
  const {asPath} = useRouter()
  const [display, setDisplay] = useState(false)
  const hasNotified = useRef(false)
  const {data: subscriptions} = ApiV1.useSubscriptionsQuery({
    skip: !hasUser
  })
  const {
    elements: {H5, Paragraph, Button, Link}
  } = useWebsiteBuilder()

  const onNotify = useCallback((notify: () => void) => {
    if (!hasNotified.current) {
      hasNotified.current = true
      notify()
    }
  }, [])

  useEffect(() => {
    if (hasUser && subscriptions?.subscriptions.length) {
      return onNotify(() => onPay?.())
    } else if (localStorage.getItem(CookieOrPayKey)) {
      return onNotify(() => onCookie?.())
    }

    const excludedPages = ['/mitmachen', '/login', '/signup', '/datenschutz', '/profile']
    setDisplay(!excludedPages.some(str => asPath.startsWith(str)))
  }, [hasUser, subscriptions, onPay, onCookie, asPath, onNotify])

  return (
    <Modal open={display} component="section" slots={{backdrop: CookieOrPayBackdrop}}>
      <CookieOrPayWrapper>
        <H5 component="h1" color="white">
          Wie möchten Sie www.mannschaft.com nutzen?
        </H5>

        <CookieOrPayConsents>
          <Card sx={acceptCookiesStyles}>
            <CardContent>
              <H5 component="h2" gutterBottom>
                Mit Werbung nutzen
              </H5>

              <Paragraph gutterBottom={false}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.{' '}
                <Link href="/datenschutz">Datenschutzhinweisen</Link>.
              </Paragraph>
            </CardContent>

            <CardActions>
              <Button
                variant="text"
                onClick={() => {
                  setDisplay(false)
                  localStorage.setItem(CookieOrPayKey, new Date().getTime().toString())
                  onNotify(() => onCookie?.())
                }}>
                AKZEPTIEREN UND WEITER
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardContent>
              <H5 component="h2" gutterBottom>
                Ohne Werbung nutzen
              </H5>

              <Paragraph gutterBottom={false}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </Paragraph>
            </CardContent>

            <CardActions>
              <Button variant="text" LinkComponent={Link} href="/mitmachen">
                MEHR ZUM MANNSCHAFT-ABO
              </Button>
            </CardActions>
          </Card>
        </CookieOrPayConsents>

        <CookieOrPayText>
          <Paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Paragraph>

          <Paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Paragraph>

          <Paragraph gutterBottom={false}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Paragraph>
        </CookieOrPayText>
      </CookieOrPayWrapper>
    </Modal>
  )
}
