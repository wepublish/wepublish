import {runServer} from './app'
import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './nestapp/app.module'
import {MediaAdapter} from '@wepublish/image/api'
import {PaymentsService} from '@wepublish/payment/api'
import {MailContext} from '@wepublish/mail/api'
import helmet from 'helmet'
import {GatewayModule} from './nestapp/gateway.module'
import {
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingDataSource,
  MAX_PAYLOAD_SIZE
} from '@wepublish/api'
import {json, urlencoded} from 'body-parser'

async function bootstrap() {
  const port = process.env.PORT ?? 4000
  const privatePort = +port + 1

  const nestApp = await NestFactory.create(AppModule)
  nestApp.enableCors({
    origin: true,
    credentials: true
  })
  nestApp.use(helmet())
  nestApp.use(json({limit: MAX_PAYLOAD_SIZE}))
  nestApp.use(urlencoded({extended: true, limit: MAX_PAYLOAD_SIZE}))
  const mediaAdapter = nestApp.get(MediaAdapter)
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
  gatewayApp.use('/v1', json({limit: MAX_PAYLOAD_SIZE}))
  gatewayApp.use('/v1', urlencoded({extended: true, limit: MAX_PAYLOAD_SIZE}))
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
