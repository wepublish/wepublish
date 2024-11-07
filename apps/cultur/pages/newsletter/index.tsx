import {Box} from '@mui/material'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import BriefingPage from '../../src/components/newsletter/briefing-page'
import MailchimpSubscribeForm from '../../src/components/newsletter/mailchimp-form'

type NewsletterPageProps = {
  mailchimpSignupUrl: string
}

export default function NewsletterPage({mailchimpSignupUrl}: NewsletterPageProps) {
  const {query} = useRouter()
  const {firstname, lastname, email, source} = query

  return (
    <Box>
      <BriefingPage
        title={'Cultur Briefing'}
        subtitle={'Das Wichtigste für den Start in den Tag'}
        lead={<>Willst du wissen, was in der Kulturwelt los ist?</>}
        wakeup={
          <>
            Der Kultur-Newsletter «Cültür» kommentiert und kuratiert alles, was die Schweizer
            Kulturwelt bewegt - oder auch nicht bewegt.
          </>
        }
        ready={
          <>
            <span className="readytext--everyday">Jeden Freitag ab</span>
            <br />
            <span className="readytext--time">06:00</span>
            <br />
            <span className="readytext--ready">für dich bereit</span>
          </>
        }
        delivery={<>Dein neuer Kultur-Newsletter, passend aufs Wochenende.</>}
        subscribe={<>Jetzt anmelden und bestens informiert sein!</>}
        independent={
          <>
            <span className="independenttext--independent">Unabhängig und</span>
            <br />
            <span className="independenttext--free">kostenlos</span>
          </>
        }
        mainBackground={'#feeae3'}
        leadColor={'black'}
        headerBackgroundImage={'/images/Selfieshow.jpeg'}
        independentBackgroundImage={'/images/Hall.jpeg'}
        footerBackgroundImage={'/images/Tiger.jpeg'}
        blobBackground={
          'linear-gradient(to right top, var(--gradient-pink-dark), var(--gradient-pink-bright))'
        }
        deliveryBackground={'linear-gradient(to top right, #00304b, #2161a6, #ffbaba)'}
        subscribetextBackground={
          'linear-gradient(to right, var(--gradient-orange-dark), var(--gradient-orange-bright))'
        }
        readyBackgroundColor={
          'linear-gradient(to right, var(--gradient-orange-dark), var(--gradient-orange-bright))'
        }
        signupForm={
          <MailchimpSubscribeForm
            signupUrl="https://ch-interkultur.us12.list-manage.com/subscribe/post?u=930fd0ccfcf8b34b60492e282&id=7755141349"
            defaultEmail={(email as string) || undefined}
            defaultFirstName={(firstname as string) || undefined}
            defaultLastName={(lastname as string) || undefined}
            source={(source as string) || undefined}
          />
        }
      />
    </Box>
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
