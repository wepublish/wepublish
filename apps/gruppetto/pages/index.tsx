import {Typography, styled} from '@mui/material'
import {
  PageContainer,
  PayInvoicesContainer,
  SubscribeContainer,
  WebsiteBuilderProvider
} from '@wepublish/website'
import Image from 'next/image'
import Marlen from '../src/2212_Marlen Reusser030_396 1.png'
import Marlen2 from '../src/2212_Marlen Reusser030_396 2.png'
import {BreakImage} from '../src/components/break'
import {BreakText} from '../src/components/break-text'
import {CrowdfundingChart} from '../src/components/crowdfunding/crowdfunding-chart'
import {Intro} from '../src/components/intro'
import {PayInvoices} from '../src/components/memberships/pay-invoices'
import {Subscribe} from '../src/components/memberships/subscribe'

const SubscriptionWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
`

export function Index() {
  return (
    <>
      <Intro />


      <SubscriptionWrapper id={'unterstuetze-uns'}>
        <WebsiteBuilderProvider Subscribe={Subscribe} PayInvoices={PayInvoices}>
          <PayInvoicesContainer />
          <SubscribeContainer />
        </WebsiteBuilderProvider>
      </SubscriptionWrapper>

      <BreakImage id={'ueber-uns'}>
        <div>
          <Typography component="h2" variant="h4" marginBottom={3}>
            Das Magazin
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Das «Gruppetto» ist ein hochwertiges Radsport-Magazin, das man gerne in den Händen hält und dabei ein Gefühl der 
            Freiheit spürt. Die erste Nummer des «Gruppetto» ist im Juni 2023 erschienen. Wir haben die beiden neuen Schweizer 
            Teams Tudor und Q36.5 begleitet und Hintergründe geliefert. Wir haben das Leiden von Robin Gemperle, einem 
            Schweizer Ultracycling-Fahrer beschrieben, der sich von nichts stoppen lässt. Oder wir haben Marlen Reusser getroffen, 
            um ein Porträt über die Olympia-Silbermedaillen-Gewinnerin und amtierende Europameisterin im Zeitfahren zu schreiben, 
            die mit 25 Jahren noch nicht einmal mit dem Gedanken spielte, Radprofi zu werden.

            Ab März 2024 erscheint das Magazin viermal im Jahr.

          </Typography>

          <Typography variant="body1">
            An der ersten Ausgabe haben mehrere Dutzend Journalist:innen, Fotograf:innen,
            Grafiker:innen, Layouter:innen zusammen mit uns gearbeitet. Dabei ist ein vielfältiges
            Heft entstanden. Wir haben die beiden neuen Schweizer Teams Tudor und Q36,5 begleitet
            und Hintergründe geliefert. Wir haben das Leiden von Robin Gemperle, einem Schweizer
            Ultracycling-Fahrer beschrieben, der sich von nichts stoppen lässt. Oder wir haben
            Marlen Reusser getroffen, um ein Porträt über die Olympia-Silbermedaillen-Gewinnerin und
            amtierende Europameisterin im Zeitfahren zu schreiben, die mit 25 Jahren noch nicht
            einmal mit dem Gedanken spielte, Radprofi zu werden.
          </Typography>
        </div>

        <Image
          width={Marlen.width}
          height={Marlen.height}
          quality={100}
          src={Marlen.src}
          blurDataURL={Marlen.blurDataURL}
          alt="Unser Traum"
          loading="lazy"
        />
      </BreakImage>

      <BreakImage>
        <Image
          width={Marlen2.width}
          height={Marlen2.height}
          quality={100}
          src={Marlen2.src}
          blurDataURL={Marlen2.blurDataURL}
          alt="Über Uns"
          loading="lazy"
        />

        <div>
          <Typography component="h2" variant="h4" marginBottom={3}>
            Team
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Hinter dem Gruppetto stehen Corsin Zander, Kathrin Hefel, Laurent Aeberli, Pascal Ritter und Tim Brühlmann.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Corsin Zander ist 2008 in den Journalismus eingestiegen und Co-Chefredaktor beim «Gruppetto». 
            Daneben arbeitet er beim «Tages-Anzeiger». Corsin schaut dafür, dass das Gruppetto das Ziel in der Karenzzeit erreicht.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Pascal Ritter ist der eigentliche Ideengeber des Magazins. An Montagen flitzt er als Velokurier durch Zürich. Er 
            ist Co-Chefredaktor des «Gruppetto» und arbeitet bei den Zeitungen von CH-Media. Pascal liefert für die 
            Taktik des Gruppetto die nötige Kreativität.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Tim Brühlmann ist der kreative Leiter des «Gruppetto». Zudem ist er Verantwortlicher für den grafischen 
            Auftritt des Ochsner Sport und gestaltet das «Playground Magazine». Dank Tims Erfahrung, rollt das Gruppetto 
            sicher die Serpentinen zum Gipfel hinauf.
          </Typography>
          
          <Typography variant="body1" marginBottom={2}>
            Kathrin Hefel ist freischaffende Grafikerin. Sie hat das Design des «Gruppetto» entwickelt und verantwortet 
            das Layout des Magazins. Daneben arbeitet sie für weitere Magazine wie «Caminada» und «Travel». Dank Kathrin 
            sieht das Gruppetto immer gut aus.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Laurent Aeberli ist Musiker und Projekt-Manager. Er kümmert sich um den digitalen Auftritt des «Gruppetto». 
            Zuletzt hat er die Medienstiftung We.Publish mitaufgebaut und davor bei «Watson» gearbeitet. Mit Laurent 
            verpasst das Gruppetto keine neue Entwicklung im Rennen.
          </Typography>
          
        </div>
      </BreakImage>

      <BreakText>
        <Typography component="h2" variant="h4">
          Warum «Gruppetto»?
        </Typography>

        <Typography variant="body1">
          Das Sportlexikon definiert den Begriff als «Gruppe der abgehängten Radprofis bei
          Bergetappen». Natürlich wollen wir nicht das Magazin der Abgehängten sein. Aber im
          Gruppetto zählt das, was der Radsport für uns ausmacht. Hier schliessen sich auf
          Bergettappen einer grossen Rundfahrt die ausgepowerten Helfer:innen mit den etwas
          schwereren Sprinter:innen zusammen und bilden eine Einheit, um gemeinsam innerhalb des
          Zeitlimits, der sogenannten Karenzzeit, das Etappenziel zu erreichen. Hier gibt man sich
          nicht nur gegenseitig Windschatten, sondern hilft einander mit Essen, Trinkflaschen oder
          Ersatzteilen aus. Im Zentrum steht die Solidarität untereinander.
        </Typography>
      </BreakText>

      <PageContainer slug="" />
    </>
  )
}

export default Index
