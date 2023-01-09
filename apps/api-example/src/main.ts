import {runServer} from './app'

import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {AppModule} from './nestapp/app.module'

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule)
  const globalPrefix = 'v2'
  nestApp.setGlobalPrefix(globalPrefix)
  const port = process.env.PORT ?? 4000

  const expressApp = nestApp.getHttpAdapter().getInstance()
  await runServer(expressApp).catch(err => {
    console.error(err)
    process.exit(1)
  })

  await nestApp.listen(port)
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`)
}

bootstrap()
