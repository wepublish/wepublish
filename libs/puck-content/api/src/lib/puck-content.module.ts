import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@wepublish/authentication/api';

import { PuckAiController } from './puck-ai.controller';

@Module({
  imports: [ConfigModule, AuthenticationModule],
  controllers: [PuckAiController],
})
export class PuckContentModule {}
