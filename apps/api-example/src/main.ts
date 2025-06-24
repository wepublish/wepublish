import {runServer} from './app'
import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './nestapp/app.module'
import {MediaAdapter} from '@wepublish/image/api'
import {PaymentsService} from '@wepublish/payment/api'
import {MailContext} from '@wepublish/mail/api'
import helmet from 'helmet'
import {
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingDataSource,
  MAX_PAYLOAD_SIZE
} from '@wepublish/api'
import {json, urlencoded} from 'body-parser'

async function bootstrap() {
  const port = process.env.PORT ?? 4000

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
  const hotAndTrendingDataSource = nestApp.get<HotAndTrendingDataSource>(
    HOT_AND_TRENDING_DATA_SOURCE
  )

  const publicExpressApp = nestApp.getHttpAdapter().getInstance()

  await runServer({
    publicExpressApp,
    mediaAdapter,
    paymentProviders,
    mailProvider,
    hotAndTrendingDataSource
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

  await nestApp.listen(port)
  Logger.log(`🚀 Public api is running on: http://localhost:${port}`)
}

bootstrap()
