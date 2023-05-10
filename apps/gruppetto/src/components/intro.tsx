import {css, styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website'
import Link from 'next/link'
import {memo} from 'react'

const IntroWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  max-width: 800px;
`

const ActionWrapper = styled('div')`
  display: grid;
  margin-top: ${({theme}) => theme.spacing(3)};
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: max-content max-content;
    }
  `}
`

const UnstyledLink = styled(Link)`
  text-decoration: none;
  display: grid;
`

const Intro = () => {
  const {
    elements: {Button, Paragraph, H3, Link}
  } = useWebsiteBuilder()

  return (
    <IntroWrapper>
      <H3 component="h1">Das neue Magazin für Radsport und Velokultur erscheint im Juni</H3>

      <Paragraph>
        Das «Gruppetto»-Magazin erzählt packende Radsport-Geschichten, beleuchtet weniger bekannte
        Hintergründe und widerspiegelt die Velobegeisterung der Leser:innen. Das Crowdfunding haben
        wir erfolgreich abgeschlossen und die erste Ausgabe erscheint im Juni. Dies feiern wir mit
        einem Launch-Event inkusive Social Ride am 2. Juni in der Zitrone Manegg, Allmendstrasse 91,
        8041 Zürich. Wer sich unverbindlich anmelden möchte,{' '}
        <Link
          href={
            'https://docs.google.com/forms/d/e/1FAIpQLSeydk0djDKZsAD--MdGiKCljaSc_lNi4s2kqg-3aNjTa9EtCw/viewform'
          }
          target="_blank">
          kann das hier tun.
        </Link>
      </Paragraph>

      <Paragraph>
        Wer das «Gruppetto» abonnieren möchte, kann dies ab Juni hier auf der Website tun. Werden
        mindestens 3000 Abos abgeschlossen, erscheint das «Gruppetto» ab 2024 viermal jährlich.
      </Paragraph>

      <Paragraph>
        Du hast das Crowdfunding und damit die erste Ausgabe verpasst? Löse ein Ticket für den
        Besenwagen und wir schicken dir die Nummer 1 noch per Post nachhause.
      </Paragraph>

      <Paragraph>
        Deine Firma möchte ein Inserat im ersten Gruppetto-Magazin schalten oder eine
        Werbe-Partnerschaft eingehen? Melde dich auf{' '}
        <Link href="mailto:redaktion@gruppetto-magazin.ch">redaktion@gruppetto-magazin.ch</Link> und
        wir erarbeiten zusammen eine passende Lösung.
      </Paragraph>

      <ActionWrapper>
        <UnstyledLink href="#unterstuetze-uns" scroll={false} shallow>
          <Button>Unterstütze uns</Button>
        </UnstyledLink>

        <UnstyledLink href="#ueber-uns" scroll={false} shallow>
          <Button variant="text">Mehr über das Magazin</Button>
        </UnstyledLink>
      </ActionWrapper>
    </IntroWrapper>
  )
}

const ConnectedIntro = memo(Intro)
export {ConnectedIntro as Intro}
