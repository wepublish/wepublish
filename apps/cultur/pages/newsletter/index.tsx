import {GetStaticProps} from 'next'
import getConfig from 'next/config'
import {useRouter} from 'next/router'

import MailchimpSubscribeForm from '../../src/components/newsletter/mailchimp-form'

type NewsletterPageProps = {
  mailchimpSignupUrl: string
}

export default function NewsletterPage({mailchimpSignupUrl}: NewsletterPageProps) {
  const {query} = useRouter()
  const {firstname, lastname, email} = query

  return (
    <>
      <MailchimpSubscribeForm
        signupUrl={mailchimpSignupUrl}
        defaultEmail={(email as string) || undefined}
        defaultFirstName={(firstname as string) || undefined}
        defaultLastName={(lastname as string) || undefined}
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
