import {Link, Typography} from '@mui/material'
import {PageContainer} from '@wepublish/website'
import Image from 'next/image'
import Marlen from '../src/2212_Marlen Reusser030_396 1.png'
import Marlen2 from '../src/2212_Marlen Reusser030_396 2.png'
import {BreakImage} from '../src/components/break'
import {BreakText} from '../src/components/break-text'
import {CrowdfundingChart} from '../src/components/crowdfunding/crowdfunding-chart'
import {Donate} from '../src/components/crowdfunding/donate'
import {Intro} from '../src/components/intro'

export function Index() {
  return (
    <>
      <Intro />

      <CrowdfundingChart id={'unterstuetze-uns'} />

      <Donate />

      <BreakImage id={'ueber-uns'}>
        <div>
          <Typography component="h2" variant="h4" marginBottom={3}>
            Unser Traum
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Wir sind vor zwei Jahren mit einer Idee losgerollt, die uns seither nicht mehr loslässt.
            Wir wollen ein hochwertiges Radsport-Magazin herausgeben, das man gerne in den Händen
            hält und dabei ein Gefühl der Freiheit spürt. Das «Gruppetto» soll ab 2024 viermal im
            Jahr erscheinen und allen Abonnent:innen nachhause geliefert werden. Damit wir dieses
            Ziel erreichen, erscheint pünktlich zur Tour de Suisse im kommenden Juni die erste
            Ausgabe des «Gruppetto». Es soll alle Radsportbegeisterte erreichen und sie dazu
            animieren, das Magazin zu abonnieren. Nun benötigen wir Geld, um das Magazin in einer
            möglichst hohen Auflage zu drucken und möglichst breit zu verteilen.
          </Typography>

          <Typography variant="body1">
            Bereits arbeiten mehrere Dutzend Journalist:innen, Fotograf:innen, Grafiker:innen,
            Layouter:innen zusammen mit uns an der ersten Ausgabe. So haben wir die beiden neuen
            Schweizer Teams Tudor und Q36,5 begleitet und liefern Hintergründe. Wir waren in Uganda
            unterwegs und haben zur Korruption im afrikanischen Radsport recherchiert. Und wir haben
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
            Hinter dem Gruppetto stehen Corsin Zander, 34, der die Fahrerinnen und Fahrer am
            liebsten vom Streckenrand aus anfeuert – ob am Mortirolo oder auf der Offenen Rennbahn
            in Oerlikon. Vor 15 Jahren ist er in den Journalismus eingestiegen und arbeitet
            mittlerweile in leitender Funktion beim «Tages-Anzeiger». Corsin schaut dafür, dass das
            Gruppetto das Ziel in der Karenzzeit erreicht.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Der eigentliche Ideengeber des Magazins ist Pascal Ritter, 37, der an Montagen als
            Velokurier durch Zürich flitzt und an den anderen Tagen als Reporter für die Zeitungen
            der CH-Media unterwegs ist oder als Tagesleiter den Online-Auftritt verantwortet. Pascal
            liefert für die Taktik des Gruppetto die zündenden Ideen.
          </Typography>

          <Typography variant="body1" marginBottom={2}>
            Der Mann fürs Grafische heisst Tim Brühlmann, 36. Er arbeitet seit 16 Jahren für
            verschiedene Schweizer Magazine («Das Magazin», «Annabelle», «Facts», «Schweizer
            Illustrierte», etc.). Zurzeit ist er Art Director und Produktionsleiter vom
            «Sport-Magazin» der «Schweizer Illustrierten». Dank Tim sieht das Gruppetto immer gut
            aus.
          </Typography>

          <Typography variant="body1">
            Wenn ihr Fragen an uns habt, kontaktiert uns per E-Mail an{' '}
            <Link href="mailto:redaktion@gruppetto-magazin.ch">redaktion@gruppetto-magazin.ch</Link>
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
