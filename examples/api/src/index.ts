#!/usr/bin/env node
import {
  Author,
  MailgunMailProvider,
  Oauth2Provider,
  PayrexxPaymentProvider,
  PublicArticle,
  PublicPage,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  URLAdapter,
  WepublishServer,
  JobType
} from '@wepublish/api'

import {KarmaMediaAdapter} from '@wepublish/api-media-karma'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb'

import {URL} from 'url'
import {SlackMailProvider} from './SlackMailProvider'
import bodyParser from 'body-parser'
import pinoMultiStream from 'pino-multi-stream'
import pinoStackdriver from 'pino-stackdriver'
import {createWriteStream} from 'pino-sentry'
import yargs from 'yargs'
// @ts-ignore
import {hideBin} from 'yargs/helpers'

interface ExampleURLAdapterProps {
  websiteURL: string
}

class ExampleURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: ExampleURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/article/${article.id}/${article.slug}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug || author.id}`
  }
}

async function asyncMain() {
  if (!process.env.MONGO_URL) throw new Error('No MONGO_URL defined in environment.')
  if (!process.env.HOST_URL) throw new Error('No HOST_URL defined in environment.')

  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error('No STRIPE_SECRET_KEY defined in environment.')
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    throw new Error('No STRIPE_WEBHOOK_SECRET defined in environment')
  if (!process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET)
    throw new Error('No STRIPE_CHECKOUT_WEBHOOK_SECRET defined in environment')

  if (!process.env.PAYREXX_INSTANCE_NAME)
    throw new Error('No PAYREXX_INSTANCE_NAME defined in environment')
  if (!process.env.PAYREXX_API_SECRET)
    throw new Error('No PAYREXX_API_SECRET defined in environment')

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

  const mediaAdapter = new KarmaMediaAdapter(
    new URL(process.env.MEDIA_SERVER_URL),
    process.env.MEDIA_SERVER_TOKEN
  )

  await MongoDBAdapter.initialize({
    url: process.env.MONGO_URL!,
    locale: process.env.MONGO_LOCALE ?? 'en',
    seed: async adapter => {
      const adminUserRole = await adapter.userRole.getUserRole('Admin')
      const adminUserRoleId = adminUserRole ? adminUserRole.id : 'fake'
      const editorUserRole = await adapter.userRole.getUserRole('Editor')
      const editorUserRoleId = editorUserRole ? editorUserRole.id : 'fake'

      await adapter.user.createUser({
        input: {
          email: 'dev@wepublish.ch',
          name: 'Dev User',
          active: true,
          properties: [],
          roleIDs: [adminUserRoleId]
        },
        password: '123'
      })

      await adapter.user.createUser({
        input: {
          email: 'editor@wepublish.ch',
          name: 'Editor User',
          active: true,
          properties: [],
          roleIDs: [editorUserRoleId]
        },
        password: '123'
      })
    }
  })

  const dbAdapter = await MongoDBAdapter.connect({
    url: process.env.MONGO_URL!,
    locale: process.env.MONGO_LOCALE ?? 'en'
  })

  const oauth2Providers: Oauth2Provider[] = [
    {
      name: 'google',
      discoverUrl: process.env.OAUTH_GOOGLE_DISCOVERY_URL ?? '',
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID ?? '',
      clientKey: process.env.OAUTH_GOOGLE_CLIENT_KEY ?? '',
      redirectUri: [process.env.OAUTH_GOOGLE_REDIRECT_URL ?? ''],
      scopes: ['openid profile email']
    },
    {
      name: 'wepublish',
      discoverUrl: process.env.OAUTH_WEPUBLISH_DISCOVERY_URL ?? '',
      clientId: process.env.OAUTH_WEPUBLISH_CLIENT_ID ?? '',
      clientKey: process.env.OAUTH_WEPUBLISH_CLIENT_KEY ?? '',
      redirectUri: [process.env.OAUTH_WEPUBLISH_REDIRECT_URL ?? ''],
      scopes: ['openid profile email']
    }
  ]

  let mailProvider
  if (
    process.env.MAILGUN_API_KEY &&
    process.env.MAILGUN_BASE_DOMAIN &&
    process.env.MAILGUN_MAIL_DOMAIN &&
    process.env.MAILGUN_WEBHOOK_SECRET
  ) {
    mailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      fromAddress: 'dev@wepublish.ch',
      webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET,
      baseDomain: process.env.MAILGUN_BASE_DOMAIN,
      mailDomain: process.env.MAILGUN_MAIL_DOMAIN,
      apiKey: process.env.MAILGUN_API_KEY,
      incomingRequestHandler: bodyParser.json()
    })
  }
  // left here intentionally for testing
  /* if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_WEBHOOK_SECRET) {
    mailProvider = new MailchimpMailProvider({
      id: 'mailchimp',
      name: 'Mailchimp',
      fromAddress: 'dev@wepublish.ch',
      webhookEndpointSecret: process.env.MAILCHIMP_WEBHOOK_SECRET,
      apiKey: process.env.MAILCHIMP_API_KEY,
      baseURL: '',
      incomingRequestHandler: bodyParser.urlencoded({extended: true})
    })
  } */

  if (process.env.SLACK_DEV_MAIL_WEBHOOK_URL) {
    mailProvider = new SlackMailProvider({
      id: 'slackMail',
      name: 'Slack Mail',
      fromAddress: 'fakeMail@wepublish.media',
      webhookURL: process.env.SLACK_DEV_MAIL_WEBHOOK_URL
    })
  }

  const paymentProviders = [
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
    }),
    new PayrexxPaymentProvider({
      id: 'payrexx',
      name: 'Payrexx',
      offSessionPayments: false,
      instanceName: process.env.PAYREXX_INSTANCE_NAME,
      instanceAPISecret: process.env.PAYREXX_API_SECRET,
      psp: [0, 15, 17, 2, 3, 36],
      pm: [
        'postfinance_card',
        'postfinance_efinance',
        // "mastercard",
        // "visa",
        'twint',
        // "invoice",
        'paypal'
      ],
      vatRate: 7.7,
      incomingRequestHandler: bodyParser.json()
    })
  ]

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

  const server = new WepublishServer({
    hostURL,
    websiteURL,
    mediaAdapter,
    dbAdapter,
    oauth2Providers,
    mailProvider,
    paymentProviders,
    urlAdapter: new ExampleURLAdapter({websiteURL}),
    playground: true,
    introspection: true,
    tracing: true,
    logger
  })

  // eslint-disable-next-line no-unused-expressions
  yargs(hideBin(process.argv))
    .command(
      ['listen', '$0'],
      'start the server',
      () => {
        /* do nothing */
      },
      async argv => {
        await server.listen(port, address)
      }
    )
    .command(
      'sendTestMail [recipient]',
      'send a test mail',
      yargs => {
        yargs.positional('recipient', {
          type: 'string',
          default: 'dev@wepublish.ch',
          describe: 'recipient of the test mail'
        })
      },
      async argv => {
        await server.runJob(JobType.SendTestMail, {
          subject: 'This is a test mail from a we.publish instance',
          recipient: argv.recipient,
          message: 'Hello from the other side',
          replyToAddress: 'dev@wepublish.ch'
        })
        process.exit(0)
      }
    )
    .command(
      'dmr',
      'Renew Memberships',
      () => {
        /* do nothing */
      },
      async argv => {
        await server.runJob(JobType.DailyMembershipRenewal, {
          startDate: new Date()
        })
        process.exit(0)
      }
    )
    .command(
      'dir',
      'Remind open invoices',
      () => {
        /* do nothing */
      },
      async () => {
        await server.runJob(JobType.DailyInvoiceReminder, {
          userPaymentURL: `${websiteURL}/user/invocies`,
          replyToAddress: 'info@tsri.ch',
          sendEveryDays: 3
        })
        process.exit(0)
      }
    )
    .command(
      'dic',
      'charge open invoices',
      () => {
        /* do nothing */
      },
      async () => {
        await server.runJob(JobType.DailyInvoiceCharger, {})
        process.exit(0)
      }
    ).argv
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
