import MailchimpSubscribeForm from '../../src/components/newsletter/mailchimp-form'
import {GetStaticProps} from 'next'
import getConfig from 'next/config'

type NewsletterPageProps = {
  mailchimpSignupUrl: string
}

export default function NewsletterPage({mailchimpSignupUrl}: NewsletterPageProps) {
  return (
    <>
      <MailchimpSubscribeForm signupUrl={mailchimpSignupUrl} />
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
