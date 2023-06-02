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
      <H3 component="h1">Abonniere das Magazin für Radsport und Velokultur</H3>

      <Paragraph>
        Das «Gruppetto»-Magazin erzählt packende Radsport-Geschichten, beleuchtet weniger bekannte
        Hintergründe und widerspiegelt die Velobegeisterung der Leser:innen.
      </Paragraph>

      <Paragraph>
        Wer das «Gruppetto» abonnieren möchte, kann dies hier auf der Website tun. Werden mindestens
        3000 Abos abgeschlossen, erscheint das «Gruppetto» ab 2024 viermal jährlich.
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
          <Button>Abo lösen</Button>
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
