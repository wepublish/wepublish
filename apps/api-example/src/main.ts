import {runServer} from './app'
import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './nestapp/app.module'
import {MediaAdapterService} from '@wepublish/image/api'
import {PaymentsService} from '@wepublish/payment/api'
import {MailContext} from '@wepublish/mail/api'
import helmet from 'helmet'
import {GatewayModule} from './nestapp/gateway.module'
import {HOT_AND_TRENDING_DATA_SOURCE, HotAndTrendingDataSource} from '@wepublish/api'
import * as Sentry from '@sentry/nestjs'
import {nodeProfilingIntegration} from '@sentry/profiling-node'

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      // Tracing
      tracesSampleRate: 1.0, //  Capture 100% of the transactions

      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0
    })
  }

  const port = process.env.PORT ?? 4000
  const privatePort = +port + 1

  const nestApp = await NestFactory.create(AppModule)
  nestApp.enableCors({
    origin: true,
    credentials: true
  })
  nestApp.use(helmet())
  const mediaAdapter = nestApp.get(MediaAdapterService)
  const paymentProviders = nestApp.get(PaymentsService).paymentProviders
  const mailProvider = nestApp.get(MailContext).mailProvider
  const privateExpressApp = nestApp.getHttpAdapter().getInstance()
  const hotAndTrendingDataSource = nestApp.get<HotAndTrendingDataSource>(
    HOT_AND_TRENDING_DATA_SOURCE
  )

  const gatewayApp = await NestFactory.create(GatewayModule)
  gatewayApp.enableCors({
    origin: true,
    credentials: true
  })
  const publicExpressApp = gatewayApp.getHttpAdapter().getInstance()

  await runServer({
    privateExpressApp,
    publicExpressApp,
    mediaAdapter,
    paymentProviders,
    mailProvider,
    hotAndTrendingDataSource
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

  await nestApp.listen(privatePort)
  Logger.log(`🚀 Private api is running on: http://localhost:${privatePort}`)

  await gatewayApp.listen(port)
  Logger.log(`🚀 Public api is running on: http://localhost:${port}`)
}

bootstrap()
