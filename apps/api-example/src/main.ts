import {runServer} from './app'
import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './nestapp/app.module'
import {MediaAdapterService} from '@wepublish/image/api'
import {PaymentsService} from '@wepublish/payment/api'
import {MailContext} from '@wepublish/mail/api'
import helmet from 'helmet'
import {GatewayModule} from './nestapp/gateway.module'

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule)
  nestApp.enableCors({
    origin: true,
    credentials: true
  })
  nestApp.use(helmet())
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

  const gatewayPort = +port + 1
  const gatewayApp = await NestFactory.create(GatewayModule, {})
  gatewayApp.enableCors({
    origin: true,
    credentials: true
  })
  await gatewayApp.listen(gatewayPort)
  Logger.log(`🚀 Gateway is running on: http://localhost:${gatewayPort}`)
}

bootstrap()
