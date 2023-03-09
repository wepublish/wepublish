import {css, styled} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website-builder'

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

export const Intro = () => {
  const {
    elements: {Button, Paragraph, H3}
  } = useWebsiteBuilder()

  return (
    <IntroWrapper>
      <H3 component="h1">Unterstütze das neue Schweizer Radsportmagazin </H3>

      <Paragraph>
        Das Gruppetto Magazin erzählt packende Velogeschichten, beleuchtet auch weniger bekannte
        Hintergründe und widerspiegelt die Velobegeisterung der Lesenden. Diese Begeisterung besteht
        aus einem Gefühl der Freiheit. Es entsteht beim Rollen über Landstrassen und Hügel oder beim
        Anblick von Serpentinen eines Alpenpasses. Es entsteht durch den Geruch nach Asphalt und
        Sonnencreme, durch den Klang von Hochfelgen, die im Wind rauschen.
      </Paragraph>

      <ActionWrapper>
        <Button>Unterstütze uns</Button>
        <Button variant="text">Mehr über das Magazin</Button>
      </ActionWrapper>
    </IntroWrapper>
  )
}
