import {runServer} from './app'

import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {AppModule} from './nestapp/app.module'
import {MediaAdapterService} from '@wepublish/api'

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule)
  const mediaAdapter = nestApp.get(MediaAdapterService)
  const port = process.env.PORT ?? 4000

  const expressApp = nestApp.getHttpAdapter().getInstance()
  await runServer(expressApp, mediaAdapter).catch(err => {
    console.error(err)
    process.exit(1)
  })

  await nestApp.listen(port)
  Logger.log(`🚀 Application is running on: http://localhost:${port}`)
}

bootstrap()
