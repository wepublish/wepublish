import {runServer} from './app'
import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './nestapp/app.module'
import {MediaAdapterService} from '@wepublish/image/api'
import {PaymentsService} from '@wepublish/payment/api'
import {MailContext} from '@wepublish/mail/api'

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule)
  nestApp.enableCors({
    origin: true,
    credentials: true
  })
  const mediaAdapter = nestApp.get(MediaAdapterService)
  const paymentProviders = nestApp.get(PaymentsService).paymentProviders
  const mailProvider = nestApp.get(MailContext).mailProvider
  const port = process.env.PORT ?? 4000
  const expressApp = nestApp.getHttpAdapter().getInstance()

  await runServer({
    expressApp,
    mediaAdapter,
    paymentProviders,
    mailProvider
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

  await nestApp.listen(port)
  Logger.log(`🚀 Application is running on: http://localhost:${port}`)
}

bootstrap()
