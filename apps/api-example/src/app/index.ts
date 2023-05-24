import {PrismaClient} from '@prisma/client'
import {
  AlgebraicCaptchaChallenge,
  JobType,
  MailchimpMailProvider,
  MailgunMailProvider,
  MediaAdapter,
  Oauth2Provider,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  SendMailType,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  WepublishServer
} from '@wepublish/api'
import bodyParser from 'body-parser'
import path from 'path'
import pinoMultiStream from 'pino-multi-stream'
import {createWriteStream} from 'pino-sentry'
import pinoStackdriver from 'pino-stackdriver'
import * as process from 'process'
import {SlackMailProvider} from './slack-mail-provider'
import {ExampleURLAdapter} from './url-adapter'
import {Application} from 'express'
import {CronJob} from 'cron'

export async function runServer(app: Application, mediaAdapter: MediaAdapter) {
  if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL defined in environment.')
  if (!process.env.HOST_URL) throw new Error('No HOST_URL defined in environment.')

  const hostURL = process.env.HOST_URL
  const websiteURL = process.env.WEBSITE_URL ?? 'https://wepublish.ch'

  const port = process.env.PORT ? parseInt(process.env.PORT) : undefined
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  if (!process.env.MEDIA_SERVER_URL) {
    throw new Error('No MEDIA_SERVER_URL defined in environment.')
  }

  if (!process.env.MEDIA_SERVER_TOKEN) {
    throw new Error('No MEDIA_SERVER_TOKEN defined in environment.')
  }

  const prisma = new PrismaClient()
  await prisma.$connect()

  const oauth2Providers: Oauth2Provider[] = []
  if (
    process.env.OAUTH_GOOGLE_DISCOVERY_URL &&
    process.env.OAUTH_GOOGLE_CLIENT_ID &&
    process.env.OAUTH_GOOGLE_CLIENT_KEY &&
    process.env.OAUTH_GOOGLE_REDIRECT_URL
  ) {
    oauth2Providers.push({
      name: 'google',
      discoverUrl: process.env.OAUTH_GOOGLE_DISCOVERY_URL,
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientKey: process.env.OAUTH_GOOGLE_CLIENT_KEY,
      redirectUri: [process.env.OAUTH_GOOGLE_REDIRECT_URL],
      scopes: ['openid profile email']
    })
  }

  let mailProvider
  if (
    process.env.MAILGUN_API_KEY &&
    process.env.MAILGUN_BASE_DOMAIN &&
    process.env.MAILGUN_MAIL_DOMAIN
  ) {
    mailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      fromAddress:
        process.env.MAILGUN_FROM_ADDRESS || process.env.DEFAULT_FROM_ADDRESS || 'dev@wepublish.ch',
      webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET,
      baseDomain: process.env.MAILGUN_BASE_DOMAIN,
      mailDomain: process.env.MAILGUN_MAIL_DOMAIN,
      apiKey: process.env.MAILGUN_API_KEY,
      incomingRequestHandler: bodyParser.json()
    })
  }

  if (process.env.MAILCHIMP_API_KEY) {
    mailProvider = new MailchimpMailProvider({
      id: 'mailchimp',
      name: 'Mailchimp',
      fromAddress:
        process.env.MAILCHIMP_FROM_ADDRESS ||
        process.env.DEFAULT_FROM_ADDRESS ||
        'dev@wepublish.ch',
      webhookEndpointSecret: process.env.MAILCHIMP_WEBHOOK_SECRET,
      apiKey: process.env.MAILCHIMP_API_KEY,
      baseURL: '',
      incomingRequestHandler: bodyParser.urlencoded({extended: true})
    })
  }

  if (process.env.SLACK_DEV_MAIL_WEBHOOK_URL) {
    mailProvider = new SlackMailProvider({
      id: 'slackMail',
      name: 'Slack Mail',
      fromAddress: 'fakeMail@wepublish.media',
      webhookURL: process.env.SLACK_DEV_MAIL_WEBHOOK_URL
    })
  }

  const paymentProviders = []

  if (
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET &&
    process.env.STRIPE_WEBHOOK_SECRET
  ) {
    paymentProviders.push(
      new StripeCheckoutPaymentProvider({
        id: 'stripe_checkout',
        name: 'Stripe Checkout',
        offSessionPayments: false,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookEndpointSecret: process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET,
        incomingRequestHandler: bodyParser.raw({type: 'application/json'})
      }),
      new StripePaymentProvider({
        id: 'stripe',
        name: 'Stripe',
        offSessionPayments: true,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
        incomingRequestHandler: bodyParser.raw({type: 'application/json'})
      })
    )
  }

  if (
    process.env.PAYREXX_INSTANCE_NAME &&
    process.env.PAYREXX_API_SECRET &&
    process.env.PAYREXX_WEBHOOK_SECRET &&
    process.env.PAYREXX_PAYMENT_METHODS
  ) {
    const paymentMethods = process.env.PAYREXX_PAYMENT_METHODS.split(',').map(pm => pm.trim())

    paymentProviders.push(
      new PayrexxPaymentProvider({
        id: 'payrexx',
        name: 'Payrexx',
        offSessionPayments: false,
        instanceName: process.env.PAYREXX_INSTANCE_NAME,
        instanceAPISecret: process.env.PAYREXX_API_SECRET,
        psp: [0, 15, 17, 2, 3, 36],
        pm: paymentMethods,
        vatRate: 7.7,
        incomingRequestHandler: bodyParser.json()
      })
    )
    paymentProviders.push(
      new PayrexxSubscriptionPaymentProvider({
        id: 'payrexx-subscription',
        name: 'Payrexx Subscription',
        offSessionPayments: true,
        instanceName: process.env.PAYREXX_INSTANCE_NAME,
        instanceAPISecret: process.env.PAYREXX_API_SECRET,
        incomingRequestHandler: bodyParser.json(),
        webhookSecret: process.env.PAYREXX_WEBHOOK_SECRET,
        prisma
      })
    )
  }

  const prettyStream = pinoMultiStream.prettyStream()
  const streams: pinoMultiStream.Streams = [{stream: prettyStream}]

  if (process.env.GOOGLE_PROJECT) {
    streams.push({
      level: 'info',
      stream: pinoStackdriver.createWriteStream({
        projectId: process.env.GOOGLE_PROJECT,
        logName: 'wepublish_api'
      })
    })
  }

  if (process.env.SENTRY_DSN) {
    streams.push({
      level: 'error',
      stream: createWriteStream({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENV ?? 'dev'
      })
    })
  }

  const logger = pinoMultiStream({
    streams,
    level: 'debug'
  })

  const challenge = new AlgebraicCaptchaChallenge('changeMe', 600, {
    width: 200,
    height: 200,
    background: '#ffffff',
    noise: 5,
    minValue: 1,
    maxValue: 10,
    operandAmount: 1,
    operandTypes: ['+', '-'],
    mode: 'formula',
    targetSymbol: '?'
  })

  const server = new WepublishServer(
    {
      hostURL,
      websiteURL,
      mediaAdapter,
      prisma,
      oauth2Providers,
      mailProvider,
      mailContextOptions: {
        defaultFromAddress: process.env.DEFAULT_FROM_ADDRESS || 'dev@wepublish.ch',
        defaultReplyToAddress: process.env.DEFAULT_REPLY_TO_ADDRESS || 'reply-to@wepublish.ch',
        mailTemplateMaps: [
          {
            type: SendMailType.LoginLink,
            localTemplate: 'loginLink',
            local: true,
            subject: 'Welcome new Member' // only needed if remoteTemplate
          },
          {
            type: SendMailType.TestMail,
            localTemplate: 'testMail',
            local: true
          },
          {
            type: SendMailType.PasswordReset,
            localTemplate: 'passwordReset',
            local: true
          },
          {
            type: SendMailType.NewMemberSubscription,
            localTemplate: 'newMemberSubscription',
            local: true
          },
          {
            type: SendMailType.RenewedMemberSubscription,
            localTemplate: 'renewedMemberSubscription',
            local: true
          },
          {
            type: SendMailType.MemberSubscriptionOffSessionBefore,
            localTemplate: 'memberSubscriptionPayment/offSessionPaymentOneWeekBefore',
            local: true
          },
          {
            type: SendMailType.MemberSubscriptionOnSessionBefore,
            localTemplate: 'memberSubscriptionPayment/onSessionBefore',
            local: true
          },
          {
            type: SendMailType.MemberSubscriptionOnSessionAfter,
            localTemplate: 'memberSubscriptionPayment/onSessionAfter',
            local: true
          },
          {
            type: SendMailType.MemberSubscriptionOffSessionFailed,
            localTemplate: 'memberSubscriptionPayment/offSessionPaymentFailed',
            local: true
          }
        ],
        mailTemplatesPath: path.resolve('apps', 'api-example', 'templates', 'emails')
      },
      paymentProviders,
      urlAdapter: new ExampleURLAdapter({websiteURL}),
      playground: true,
      introspection: true,
      logger,
      challenge
    },
    app
  )

  const checkInvoiceCron = new CronJob('0 8 * * *', async function () {
    await server.runJob(JobType.DailyInvoiceChecker, {})
  })
  checkInvoiceCron.start()

  const chargeInvoiceCron = new CronJob('0 8 * * *', async function () {
    await server.runJob(JobType.DailyInvoiceCharger, {})
  })
  chargeInvoiceCron.start()

  const renewMemberships = new CronJob('0 8 * * *', async function () {
    await server.runJob(JobType.DailyMembershipRenewal, {
      startDate: new Date()
    })
  })
  renewMemberships.start()

  await server.listen(port, address)
}
