import {
  Backdrop,
  Card,
  CardActions,
  CardContent,
  Modal,
  styled,
  SxProps,
  Theme
} from '@mui/material'
import {useWebsiteBuilder} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useCallback, useEffect, useRef, useState} from 'react'

import {useHasSubscription} from '../paywall/has-subscription'

export type CookieOrPayProps = {
  onCookie?: () => void
  onPay?: () => void
}

export const CookieOrPayKey = 'cookieOrPay.accept-cookies' as const

export const CookieOrPayWrapper = styled('div')`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-auto-columns: minmax(0, 800px);
  grid-auto-rows: min-content;
  justify-content: center;
  justify-items: center;
  align-items: start;
  gap: ${({theme}) => theme.spacing(6)};
  justify-items: center;
  outline: none;
  overflow-y: auto;
  padding: ${({theme}) => theme.spacing(2)};
`

const ConsentCard = styled(Card)`
  display: grid;
  grid-template-rows: 1fr;
  grid-auto-rows: max-content;
`

export const CookieOrPayConsents = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  align-items: stretch;
  gap: ${({theme}) => theme.spacing(3)};
`

export const acceptCookiesStyles: SxProps<Theme> = theme => ({
  background: theme.palette.accent.main,
  color: theme.palette.accent.contrastText
})

export const CookieOrPayBackdrop = styled(Backdrop)`
  background-color: rgba(0, 0, 0, 0.9);
`

export const CookieOrPayText = styled('div')`
  color: ${({theme}) => theme.palette.getContrastText(theme.palette.common.black)};
`

export const CookieOrPay = ({onPay, onCookie}: CookieOrPayProps) => {
  const {asPath} = useRouter()
  const [display, setDisplay] = useState(false)
  const hasNotified = useRef(false)
  const hasSubscription = useHasSubscription()
  const {
    elements: {H5, Paragraph, Button, Link, UnorderedList, ListItem}
  } = useWebsiteBuilder()

  const onNotify = useCallback((notify: () => void) => {
    if (!hasNotified.current) {
      hasNotified.current = true
      notify()
    }
  }, [])

  useEffect(() => {
    if (hasSubscription) {
      return onNotify(() => onPay?.())
    } else if (localStorage.getItem(CookieOrPayKey)) {
      return onNotify(() => onCookie?.())
    }

    const excludedPages = ['/mitmachen', '/login', '/signup', '/datenschutz', '/profile']
    setDisplay(!excludedPages.some(str => asPath.startsWith(str)))
  }, [hasSubscription, onPay, onCookie, asPath, onNotify])

  return (
    <Modal open={display} component="section" slots={{backdrop: CookieOrPayBackdrop}}>
      <CookieOrPayWrapper>
        <H5 component="h1" color="white">
          Wie möchten Sie MANNSCHAFT.com nutzen?
        </H5>

        <CookieOrPayConsents>
          <ConsentCard sx={acceptCookiesStyles}>
            <CardContent>
              <H5 component="h2" gutterBottom>
                Option 1: Weiterhin kostenlos nutzen
              </H5>

              <Paragraph gutterBottom>
                Nutze unsere Webseite wie gewohnt und erhalte Zugriff auf die kostenlosen Beiträge
                mit Werbung und dem üblichen Tracking. Details dazu findest du in den{' '}
                <Link href="/datenschutz">Datenschutzrichtlinien</Link>.
              </Paragraph>

              <Paragraph gutterBottom={false}>
                Bitte beachte, dass die kostenlose Nutzung unseres Angebotes ohne deine Einwilligung
                nicht möglich ist.
              </Paragraph>
            </CardContent>

            <CardActions>
              <Button
                onClick={() => {
                  setDisplay(false)
                  localStorage.setItem(CookieOrPayKey, new Date().getTime().toString())
                  onNotify(() => onCookie?.())
                }}>
                Akzeptieren und weiter
              </Button>
            </CardActions>
          </ConsentCard>

          <ConsentCard>
            <CardContent>
              <H5 component="h2" gutterBottom>
                Option 2: Vollen Zugriff erhalten
              </H5>

              <Paragraph gutterBottom>
                Erhalte vollen Zugang zu all unseren Beiträgen und lege deine
                Datenschutzeinstellungen selber fest. Du bist bereits Abonnent*in? Dann logge dich
                einfach <Link href="/login">hier ein</Link>.
              </Paragraph>

              <Paragraph gutterBottom={false}>
                Wenn du bereits ein kostenloses Benutzer*innenkonto hast, kannst du einfach im
                Bereich <Link href="/mitmachen">Abonnement</Link> dein MANNSCHAFT-Abo bestellen.
              </Paragraph>
            </CardContent>

            <CardActions>
              <Button LinkComponent={Link} href="/mitmachen">
                Mehr zum Mannschaft-Abo
              </Button>
            </CardActions>
          </ConsentCard>
        </CookieOrPayConsents>

        <CookieOrPayText>
          <Paragraph gutterBottom>
            <strong>Allgemeine Informationen</strong>: Sowohl das Printprodukt MANNSCHAFT Magazin
            als auch die Onlineplattform MANNSCHAFT.com finanzieren sich über die Beiträge von
            Abonent*innen und Werbeplatzierungen. Werbeinhalte in Form von Bannern, gesponserten
            Beiträgen und Printinseraten werden mit «Werbung» oder «Sponsored By» gekennzeichnet.
          </Paragraph>

          <H5>Vorteile des Abonnentenmodells:</H5>
          <UnorderedList>
            <ListItem>Vollen Zugriff auf alle Beiträge (kostenlos und +)</ListItem>
            <ListItem>Individuelle Datenschutzeinstellungen</ListItem>
            <ListItem>
              Verschiedene Abo-Modelle von rein Digital-Abo bis zu Print-Abo (inkl. Digital-Abo)
            </ListItem>
          </UnorderedList>

          <H5>Einwilligung zu Cookies und Daten</H5>
          <Paragraph gutterBottom>
            Nutze unsere Webseite wie gewohnt kostenlos. Um unser digitales Angebot zu finanzieren
            und laufend zu verbessern, arbeiten wir mit Drittanbietern zusammen. Wir verwenden dafür
            Cookies und andere Technologien, um Informationen auf deinem Gerät zu speichern und
            abzurufen (dies gilt für die Nutzung von unserem Service „Weiterhin kostenlos nutzen“).
            Diese können auch personenbezogene Daten umfassen (z. B. Wiedererkennungsmerkmale,
            IP-Adressen, Profildaten), die in den Bereichen personalisierte Anzeigen und Inhalte,
            Anzeigen- und Inhaltsmessung, Erkenntnisse über Zielgruppen und Produktentwicklung
            verwendet werden. Einige unserer Partner verarbeiten deine Daten auf Grundlage von
            berechtigtem Interesse. Die Verarbeitung kann im Falle deiner Einwilligung auch
            außerhalb der EU/EWR erfolgen, wo unter Umständen kein vergleichbares Datenschutzniveau
            herrscht, z.B. in den USA; in diesem Fall erfolgt die Übermittlung in ein solches
            Drittland auf Grundlage von Art. 49 Abs. 1 a DSGVO. Deine Einwilligung kannst du
            jederzeit mit Wirkung für die Zukunft in unserer{' '}
            <Link href="/datenschutz">Datenschutzrichtlinie</Link> widerrufen.
          </Paragraph>

          <Paragraph gutterBottom={false}>
            Die Gesamtanzahl an Partnern, mit denen wir zusammenarbeiten: 151
          </Paragraph>
          <Paragraph gutterBottom>Die Verarbeitung erfolgt zu den folgenden Zwecken:</Paragraph>

          <UnorderedList>
            <ListItem>Speichern von oder Zugriff auf Informationen auf einem Endgerät</ListItem>
            <ListItem>
              Genaue Standortdaten und Identifikation durch Scannen von Endgeräten
            </ListItem>
            <ListItem>Personalisierte Werbung</ListItem>
            <ListItem>Personalisierte Inhalte</ListItem>
            <ListItem>
              Messung von Werbeleistung und der Performance von Inhalten, Zielgruppenforschung sowie
              Entwicklung und Verbesserung der Angebote
            </ListItem>
            <ListItem>Verwendung reduzierter Daten zur Auswahl von Inhalten</ListItem>
            <ListItem>
              Datenübermittlung an Partner außerhalb der EU/EWR (Drittlandstransfer)
            </ListItem>
          </UnorderedList>
        </CookieOrPayText>
      </CookieOrPayWrapper>
    </Modal>
  )
}
