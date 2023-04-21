import {css, styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website'
import {differenceInDays} from 'date-fns'
import Link from 'next/link'
import Script from 'next/script'
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
    elements: {Button, Paragraph, H3}
  } = useWebsiteBuilder()

  const difference = Math.max(0, differenceInDays(new Date('2023-05-11'), new Date()))

  return (
    <IntroWrapper>
      <H3 component="h1">Unterstütze das neue Radsport-Magazin aus der Schweiz</H3>

      <Paragraph>
        Das «Gruppetto»-Magazin will packende Radsport-Geschichten erzählen, weniger bekannte
        Hintergründe beleuchten und die Velobegeisterung der Leser:innen widerspiegeln. Diese
        Begeisterung besteht aus einem Gefühl der Freiheit. Es entsteht beim Rollen über
        Landstrassen und Hügel oder beim Anblick von Serpentinen eines Alpenpasses. Es entsteht
        durch den Geruch nach Asphalt und Sonnencreme, durch den Klang von Hochfelgen, die im Wind
        rauschen. Verhelfe dem «Gruppetto» jetzt zum Erfolg{' '}
        {(difference && <strong>und unterstütze uns noch {difference} Tage!</strong>) || <>.</>}
      </Paragraph>

      <Paragraph>
        Deine Firma möchte ein Inserat im ersten Gruppetto-Magazin schalten oder eine
        Werbe-Partnerschaft eingehen? Melde dich auf{' '}
        <Link href="mailto:redaktion@gruppetto-magazin.ch">redaktion@gruppetto-magazin.ch</Link> und
        wir erarbeiten zusammen eine passende Lösung.
      </Paragraph>

      <div style={{padding: '56.25% 0 0 0', position: 'relative'}}>
        <iframe
          src="https://player.vimeo.com/video/812916971?h=ee3ad2232d&color=ffffff&title=0&byline=0&portrait=0"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen></iframe>
      </div>

      <Script async src="https://player.vimeo.com/api/player.js" />

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
