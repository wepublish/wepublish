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
      <H3 component="h1">Abonniere das neue Velomagazin aus der Schweiz</H3>

      <Paragraph>
        Das «Gruppetto»-Magazin erzählt packende Radsport-Geschichten, beleuchtet weniger bekannte
        Hintergründe und widerspiegelt die Velobegeisterung der Leser:innen.
      </Paragraph>

      <Paragraph>
        Es ist im Sommer 2023 zum allerersten Mal gedruckt worden. Ab 2024 erschein das Heft viermal jährlich. Wer das «Gruppetto» abonnieren möchte,
        kann dies hier auf der Website tun.
      </Paragraph>

      <Paragraph>
       Du möchtest gerne die erste Ausgabe bestellen? Oder einen Gruppetto-Bidon oder ein Velochäppli? Hier gelangst du zu unserem {' '}
        <Link href="https://gruppetto.bigcartel.com">Shop</Link>.
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
