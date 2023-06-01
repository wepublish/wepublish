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
            Unser Traum
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Wir sind vor zwei Jahren mit einer Idee losgerollt, die uns seither nicht mehr loslässt.
            Wir wollen ein hochwertiges Radsport-Magazin herausgeben, das man gerne in den Händen
            hält und dabei ein Gefühl der Freiheit spürt. Die erste Nummer des «Gruppetto» ist um
            Juni erschienen. Nun entscheidet sich, ob es ab 2024 viermal im Jahr allen
            Abonnent:innen nachhause geliefert werden soll.
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
            Über Uns
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Hinter dem Gruppetto stehen Corsin Zander, Pascal Ritter und Tim Brühlmann.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Corsin Zander, 34, feuert die Fahrerinnen und Fahrer am liebsten vom Streckenrand aus an
            – ob am Mortirolo oder auf der Offenen Rennbahn in Oerlikon. Vor 15 Jahren ist er in den
            Journalismus eingestiegen und arbeitet mittlerweile in leitender Funktion beim
            «Tages-Anzeiger». Corsin schaut dafür, dass das Gruppetto das Ziel in der Karenzzeit
            erreicht.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Der eigentliche Ideengeber des Magazins ist Pascal Ritter, 37. An Montagen flitzt er als
            Velokurier durch Zürich. Den Rest der Woche ist er als Reporter für die Zeitungen von
            CH-Media unterwegs oder verantwortet als Tagesleiter den Online-Auftritt. Pascal liefert
            für die Taktik des Gruppetto die nötige Kreativität.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Der Mann für Grafik und Produktion heisst Tim Brühlmann, 36. Er arbeitet seit 16 Jahren
            für verschiedene Schweizer Magazine («Das Magazin», «Annabelle», «Facts», «Schweizer
            Illustrierte», etc.). Zurzeit ist er Art Director und Produktionsleiter vom
            «Sport-Magazin» der «Schweizer Illustrierten». Dank Tims Erfahrung, rollt das Gruppetto
            sicher die Serpentinen zum Gipfel hinauf und sieht dabei auch noch gut aus.
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
