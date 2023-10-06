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
      <H3 component="h1">Abonniere das neue Velomagazin</H3>

      <Paragraph>
        «Gruppetto» ist das neue Magazin für Radsport und Velokultur aus der Schweiz. 
        Es erzählt packende Radsport-Geschichten, beleuchtet weniger bekannte Hintergründe und widerspiegelt die Velobegeisterung der Leser:innen.
      </Paragraph>

      <Paragraph>
        Es ist diesen Sommer zum allerersten Mal gedruckt worden. Ab 2024 wird es viermal jährlich erscheinen. Wer das «Gruppetto» abonnieren möchte, 
        kann dies hier auf der Website tun. In unserem  {' '}
        <Link href="https://gruppetto.bigcartel.com">Shop</Link>
        gibt es die erste Ausgabe sowie weitere «Gruppetto» Produkte wie den Bidon oder das Velochäppli. 
        Wer die erste Ausgabe im ePaper lesen möchte, kann das {' '}
        <Link href="https://gruppetto.tiun.store/">hier</Link> tun:
      </Paragraph>
        
      <ActionWrapper>
        <UnstyledLink href="#unterstuetze-uns" scroll={false} shallow>
          <Button>Abo lösen</Button>
        </UnstyledLink>

        <UnstyledLink href="#ueber-uns" scroll={false} shallow>
          <Button variant="text">Mehr über das Magazin</Button>
        </UnstyledLink>
        
        <UnstyledLink href="https://gruppetto.tiun.store/" scroll={false} shallow>
          <Button variant="text">Online lesen</Button>
        </UnstyledLink>
      </ActionWrapper>
    </IntroWrapper>
  )
}

const ConnectedIntro = memo(Intro)
export {ConnectedIntro as Intro}
