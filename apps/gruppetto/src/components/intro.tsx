import {css, styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website'
import {differenceInDays} from 'date-fns'
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
    elements: {Button, Paragraph, H3}
  } = useWebsiteBuilder()

  const difference = Math.max(0, differenceInDays(new Date('2023-04-28'), new Date()))

  return (
    <IntroWrapper>
      <H3 component="h1">Unterstütze das neue Radsport-Magazin aus der Schweiz</H3>

      <Paragraph>
        Das «Gruppetto»-Magazin will packende Velogeschichten erzählen, weniger bekannte
        Hintergründe beleuchten und die Velobegeisterung der Leser:inne widerspiegeln. Diese
        Begeisterung besteht aus einem Gefühl der Freiheit. Es entsteht beim Rollen über
        Landstrassen und Hügel oder beim Anblick von Serpentinen eines Alpenpasses. Es entsteht
        durch den Geruch nach Asphalt und Sonnencreme, durch den Klang von Hochfelgen, die im Wind
        rauschen. Verhelfe dem «Gruppetto» jetzt zum Erfolg{' '}
        {(difference && <strong>und unterstütze uns noch {difference} Tage!</strong>) || <>.</>}
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
