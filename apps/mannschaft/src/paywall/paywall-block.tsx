import {css} from '@emotion/react'
import {styled, Theme} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website'
import Image from 'next/image'

import PaywallImage from './liebe-zeigen-abo.png'

export const PaywallBlockWrapper = styled('div')`
  display: grid !important; // exception as it should always be shown
  background-color: ${({theme}) => theme.palette.warning.light};
  color: ${({theme}) => theme.palette.warning.contrastText};
  padding: ${({theme}) => theme.spacing(4)};
  justify-content: center;
  align-items: center;
`

const buttonStyles = (theme: Theme) => css`
  width: fit-content;
`

export const PaywallBlock = () => {
  const {
    elements: {Button, Link, Paragraph}
  } = useWebsiteBuilder()

  return (
    <PaywallBlockWrapper>
      <Image
        alt="Mannschaft+ Teaser"
        src={PaywallImage.src}
        height={PaywallImage.height}
        width={PaywallImage.width}
      />

      <Paragraph>
        Jetzt alle Artikel auf MANNSCHAFT.com lesen: Für diesen Artikel benötigst du ein
        Digital-Abo, zu finden in unserem <Link href="/mitmachen">Abo-Shop</Link>.
      </Paragraph>

      <Paragraph>
        Hast du bereits ein Abo? <Link href="/login">Hier geht&apos;s lang zum Log-in.</Link>
      </Paragraph>

      <Paragraph>
        Abonnent*innen der Print-Ausgabe können ihr Digital-Abo kostenlos freischalten: Deine
        Mailadresse ist hinterlegt, du bekommst mit <Link href="/login">Login mit Email</Link>{' '}
        zugriff. Melde dich bitte bei kontakt (at) mannschaft.com falls deine Mailadresse nicht
        hinterlegt ist.
      </Paragraph>

      <Button
        variant="contained"
        LinkComponent={Link}
        href={'/mitmachen'}
        css={theme => buttonStyles(theme as Theme)}>
        Abo lösen
      </Button>
    </PaywallBlockWrapper>
  )
}
