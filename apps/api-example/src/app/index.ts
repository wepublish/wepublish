import {PrismaClient} from '@prisma/client'
import {
  AlgebraicCaptchaChallenge,
  MailProvider,
  MediaAdapter,
  Oauth2Provider,
  PaymentProvider,
  URLAdapter,
  WepublishServer
} from '@wepublish/api'
import pinoMultiStream from 'pino-multi-stream'
import {createWriteStream} from 'pino-sentry'
import pinoStackdriver from 'pino-stackdriver'
import * as process from 'process'
import {Application} from 'express'
import {loadAsync} from 'node-yaml-config'
import {DefaultURLAdapter, BajourURLAdapter, TsriURLAdapter} from '../urlAdapters'
const MS_PER_DAY = 24 * 60 * 60 * 1000

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
  /*
   * Load User specific configuration
   */

  const config = await loadAsync(process.env.CONFIG_FILE_PATH)

  /*
   * Basic configuration
   */

  if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL defined in environment.')
  if (!process.env.HOST_URL) throw new Error('No HOST_URL defined in environment.')
  if (!process.env.WEBSITE_URL) throw new Error('No WEBSITE_URL defined in environment.')
  const hostURL = process.env.HOST_URL
  const websiteURL = process.env.WEBSITE_URL
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3002
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  /*
   * Media Adapter configuration
   */

  if (!process.env.MEDIA_SERVER_URL) throw new Error('No MEDIA_SERVER_URL defined in environment.')
  if (!process.env.MEDIA_SERVER_TOKEN)
    throw new Error('No MEDIA_SERVER_TOKEN defined in environment.')

  /*
   * Connect to database
   */

  const prisma = new PrismaClient()
  await prisma.$connect()

  /*
   * Load OAuth Providers
   */

  const oauth2Providers: Oauth2Provider[] = []
  const Oauth2ProvidersRaw = config.OAuthProviders
  if (Oauth2ProvidersRaw) {
    for (const provider of Oauth2ProvidersRaw) {
      oauth2Providers.push(provider)
    }
  }

  /*
   * Load logging providers
   */

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

  /*
   * Load correct URL adapter
   */

  // Load default
  let urlAdapter: URLAdapter = new DefaultURLAdapter({websiteURL})

  // Load Bajour
  if (config.general.urlAdapter === 'bajour') {
    const blocksHost = process.env.BLOCKS_HOST
    if (!blocksHost) throw new Error('No BLOCKS_HOST defined in environment.')
    urlAdapter = new BajourURLAdapter({websiteURL, blocksHost})
  }
  if (config.general.urlAdapter === 'tsri') {
    urlAdapter = new TsriURLAdapter({websiteURL})
  }

  /**
   * Challenge
   */
  const challenge = new AlgebraicCaptchaChallenge(
    config.challenge.secret,
    config.challenge.validTime,
    {
      width: config.challenge.width,
      height: config.challenge.height,
      background: config.challenge.background,
      noise: config.challenge.noise,
      minValue: config.challenge.minValue,
      maxValue: config.challenge.maxValue,
      operandAmount: config.challenge.operandAmount,
      operandTypes: config.challenge.operandTypes,
      mode: config.challenge.mode,
      targetSymbol: config.challenge.targetSymbol
    }
  )

  /**
   * Load session time to live (TTL)
   */
  const sessionTTLDays = config.general.sessionTTLDays ? config.general.sessionTTLDays : 7
  const sessionTTL = sessionTTLDays * MS_PER_DAY

  const server = new WepublishServer(
    {
      hostURL,
      websiteURL,
      sessionTTL,
      mediaAdapter,
      prisma,
      oauth2Providers,
      mailProvider,
      mailContextOptions: {
        defaultFromAddress: config.mailProvider.fromAddress || 'dev@wepublish.ch',
        defaultReplyToAddress: config.mailProvider.replyToAddress || 'reply-to@wepublish.ch'
      },
      paymentProviders,
      urlAdapter: urlAdapter,
      playground: config.general.apolloPlayground ? config.general.apolloPlayground : false,
      introspection: config.general.apolloIntrospection
        ? config.general.apolloIntrospection
        : false,
      logger,
      challenge
    },
    expressApp
  )

  await server.listen(port, address)
}
