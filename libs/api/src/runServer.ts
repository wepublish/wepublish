import {CommentItemType, Peer, PrismaClient} from '@prisma/client'
import bodyParser from 'body-parser'
import path from 'path'
import pinoMultiStream from 'pino-multi-stream'
import {createWriteStream} from 'pino-sentry'
import pinoStackdriver from 'pino-stackdriver'
import * as process from 'process'
import {URL} from 'url'
import {AlgebraicCaptchaChallenge} from './lib/challenges/algebraicCaptchaChallenge'
import {WepublishServer} from './lib/server'
import {SendMailType} from './lib/mails/mailContext'
import {JobType} from './lib/jobs'
import {StripePaymentProvider} from './lib/payments/stripePaymentProvider'
import {StripeCheckoutPaymentProvider} from './lib/payments/stripeCheckoutPaymentProvider'
import {MailgunMailProvider} from './lib/mails/MailgunMailProvider'
import {PayrexxPaymentProvider} from './lib/payments/payrexxPaymentProvider'
import {Oauth2Provider} from './lib/context'
import {URLAdapter} from './lib/urlAdapter'
import {PublicArticle} from './lib/db/article'
import {PublicPage} from './lib/db/page'
import {Author} from './lib/db/author'
import {PublicComment} from './lib/db/comment'
import {KarmaMediaAdapter} from './lib/media/karmaMediaAdapter'
import {PayrexxSubscriptionPaymentProvider} from './lib/payments/payrexxSubscriptionPaymentProvider'

interface WepublishURLAdapterProps {
  websiteURL: string
}

class WepublishURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: WepublishURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getPublicArticleURL(article: PublicArticle): string {
    if (article.canonicalUrl) {
      return article.canonicalUrl
    }

    return `${this.websiteURL}/a/${article.id}/${article.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/p/${peer.id}/${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug || author.id}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment) {
    if (comment.itemType === CommentItemType.article) {
      return `${this.websiteURL}/a/${item.id}/${item.slug}#${comment.id}`
    }
    return `${this.websiteURL}/${item.slug}#${comment.id}`
  }

  getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/${token}`
  }

  getLoginURL(token: string): string {
    return `${this.websiteURL}/login?jwt=${token}`
  }
}

export async function runServer() {
  if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL defined in environment.')
  if (!process.env.HOST_URL) throw new Error('No HOST_URL defined in environment.')
  if (!process.env.WEBSITE_URL) throw new Error('No WEBSITE_URL defined in environment.')

  const hostURL = process.env.HOST_URL
  const websiteURL = process.env.WEBSITE_URL

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
    process.env.MEDIA_SERVER_TOKEN,
    process.env.MEDIA_SERVER_INTERNAL_URL
      ? new URL(process.env.MEDIA_SERVER_INTERNAL_URL)
      : undefined
  )

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

  if (process.env.PAYREXX_INSTANCE_NAME && process.env.PAYREXX_API_SECRET) {
    paymentProviders.push(
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

  const server = new WepublishServer({
    hostURL,
    websiteURL,
    mediaAdapter,
    prisma,
    oauth2Providers,
    mailProvider,
    mailContextOptions: {
      defaultFromAddress: process.env.DEFAULT_FROM_ADDRESS ?? 'dev@wepublish.ch',
      defaultReplyToAddress: process.env.DEFAULT_REPLY_TO_ADDRESS ?? 'reply-to@wepublish.ch',
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
      mailTemplatesPath: path.resolve('templates', 'emails')
    },
    paymentProviders,
    urlAdapter: new WepublishURLAdapter({websiteURL}),
    playground: true,
    introspection: true,
    logger,
    challenge
  })
}

runServer().catch(err => {
  console.error(err)
  process.exit(1)
})
