import {Container, css, styled, Theme, useTheme} from '@mui/material'
import {useUser, useWebsiteBuilder} from '@wepublish/website'
import {differenceInHours} from 'date-fns'
import {useRouter} from 'next/router'
import {useEffect, useMemo, useState} from 'react'
import {MdClose} from 'react-icons/md'

export const PaywallWrapper = styled('section')`
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  background-color: ${({theme}) => theme.palette.primary.light};
  color: ${({theme}) => theme.palette.primary.contrastText};
  padding: ${({theme}) => theme.spacing(3)};
  z-index: 1;
`

export const PaywallActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

const closeButton = (theme: Theme) => css`
  position: absolute;
  right: ${theme.spacing(3)};
  top: ${theme.spacing(3)};
  font-size: 3em;
  color: inherit;
`

export function Paywall() {
  const {hasUser} = useUser()
  const [display, setDisplay] = useState(false)
  const {
    elements: {Button, Link, Paragraph, H3, IconButton}
  } = useWebsiteBuilder()
  const theme = useTheme()
  const router = useRouter()

  // Hide paywall for logged in users, on the registration and login
  // page, and if it was hidden within the last 24 hours
  useEffect(() => {
    const path = router.pathname
    const isLoggedIn = hasUser
    const lastClosedTime = Number(localStorage.getItem('paywallLastClosed')) ?? 0
    const currentTime = new Date().getTime()

    if (
      !isLoggedIn &&
      path !== '/mitmachen' &&
      path !== '/login' &&
      differenceInHours(currentTime, lastClosedTime) > 24
    ) {
      setDisplay(true)
    } else {
      setDisplay(false)
    }
  }, [hasUser, router.pathname])

  const offset = useMemo(() => {
    const header = document.querySelector<HTMLElement>('.MuiAppBar-root')

    return header?.offsetHeight ?? 0
  }, [])

  const handleClose = () => {
    setDisplay(false)
    localStorage.setItem('paywallLastClosed', new Date().getTime().toString())
  }

  if (!display) {
    return null
  }

  return (
    <PaywallWrapper css={{top: offset}}>
      <IconButton onClick={handleClose} css={closeButton(theme)}>
        <MdClose />
      </IconButton>

      <Container maxWidth="md">
        <H3 component="h1" gutterBottom={true}>
          Werde Teil von Tsüri.ch
        </H3>

        <Paragraph>
          Wir haben weder einen reichen Onkel noch ein börsenkotiertes Unternehmen im Nacken.
          Tsüri.ch wird von 1500 Membern unterstützt, die Journalismus allen Menschen zugänglich
          machen wollen. Werde auch du Teil der Community!
        </Paragraph>

        <PaywallActions>
          <Button color="secondary" LinkComponent={Link} href="/mitmachen">
            Jetzt Member werden
          </Button>

          <Button color="secondary" variant="outlined" LinkComponent={Link} href="/login">
            Zum Login
          </Button>
        </PaywallActions>
      </Container>
    </PaywallWrapper>
  )
}
