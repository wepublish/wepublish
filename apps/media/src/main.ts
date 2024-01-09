/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {Logger} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'

import {AppModule} from './app/app.module'
import {ZodValidationPipe} from 'nestjs-zod'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ZodValidationPipe())
  app.enableCors({
    origin: true,
    credentials: true
  })

  const port = process.env.PORT || 4100
  await app.listen(port)
  Logger.log(`🚀 Application is running on: http://localhost:${port}`)
}

bootstrap()
