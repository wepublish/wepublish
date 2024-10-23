import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import MailchimpSubscribeForm from '../../src/components/newsletter/mailchimp-form'
import BriefingPage from '../../src/components/newsletter/briefing-page'

type NewsletterPageProps = {
  mailchimpSignupUrl: string
}

export default function NewsletterPage({mailchimpSignupUrl}: NewsletterPageProps) {
  const {query} = useRouter()
  const {firstname, lastname, email} = query

  return (
    <>
      <BriefingPage
        title={'Cultur Briefing'}
        subtitle={'Das Wichtigste für den Start in den Tag'}
        lead={
          'Wissen, was in der Kulturwelt los ist? Cültür kommentiert, kuratiert alles, was die Deutschschweizer Kulturwelt bewegt - oder auch nicht.'
        }
        wakeup={
          <>
            Jeden Freitag
            <br />
            um 06:00 Uhr
            <br />
            in deinem Postfach.
            <br />
            Passend aufs Wochenende.
          </>
        }
        ready={
          <>
            <span class="readytext--everyday">Jeden Morgen ab</span>
            <br />
            <span class="readytext--time">06:00</span>
            <br />
            <span class="readytext--ready">für dich bereit</span>
          </>
        }
        delivery={
          <>
            und schicken dir
            <br />
            um <span class="deliverytext--time">6 Uhr</span> die wichtigsten
            <br />
            regionalen Tagesnews
            <br />
            plus unseren Senf dazu
            <br />
            per Mail.
          </>
        }
        subscribe={
          <>
            jetzt anmelden und immer
            <br />
            bestens informiert sein!
          </>
        }
        mainBackground={'#feeae3'}
        leadColor={'black'}
        headerBackgroundImage={'/images/Selfieshow.jpeg'}
        readyBackgroundImage={'/images/Puppets.jpeg'}
        independentBackgroundImage={'/images/Scenic-Panner.png'}
        footerBackgroundImage={'/images/Kunstevent.jpeg'}
        blobBackground={
          'linear-gradient(to right top, var(--gradient-pink-dark), var(--gradient-pink-bright))'
        }
        deliveryBackground={'linear-gradient(to top right, #00304b, #2161a6, #ffbaba)'}
        subscribetextBackground={
          'linear-gradient(to right, var(--gradient-orange-dark), var(--gradient-orange-bright))'
        }
        signupForm={
          <MailchimpSubscribeForm
            signupUrl={mailchimpSignupUrl}
            defaultEmail={(email as string) || undefined}
            defaultFirstName={(firstname as string) || undefined}
            defaultLastName={(lastname as string) || undefined}
          />
        }
      />
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const {publicRuntimeConfig} = getConfig()

  if (!publicRuntimeConfig.env.MAILCHIMP_SIGNUP_URL) {
    return {props: {}, revalidate: 1}
  }

  const props = {
    mailchimpSignupUrl: publicRuntimeConfig.env.MAILCHIMP_SIGNUP_URL
  } as NewsletterPageProps

  return {
    props,
    revalidate: 60 // every 60 seconds
  }
}
