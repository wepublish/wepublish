import {PrismaClient} from '@prisma/client'
import {
  AlgebraicCaptchaChallenge,
  MailProvider,
  MediaAdapter,
  Oauth2Provider,
  PaymentProvider,
  WepublishServer
} from '@wepublish/api'
import pinoMultiStream from 'pino-multi-stream'
import {createWriteStream} from 'pino-sentry'
import pinoStackdriver from 'pino-stackdriver'
import * as process from 'process'
import {ExampleURLAdapter} from './url-adapter'
import {Application} from 'express'

type RunServerProps = {
  expressApp: Application
  mediaAdapter: MediaAdapter
  paymentProviders: PaymentProvider[]
  mailProvider: MailProvider
}

export async function runServer({
  expressApp,
  mediaAdapter,
  mailProvider,
  paymentProviders
}: RunServerProps) {
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
        defaultReplyToAddress: process.env.DEFAULT_REPLY_TO_ADDRESS || 'reply-to@wepublish.ch'
      },
      paymentProviders,
      urlAdapter: new ExampleURLAdapter({websiteURL}),
      playground: true,
      introspection: true,
      logger,
      challenge
    },
    expressApp
  )

  await server.listen(port, address)
}
