import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserModule } from '@wepublish/user/api';

import { ApiTokenResolver } from './api-token.resolver';
import { ApiTokenService } from './api-token.service';
import { ApiTokenStrategy } from './api-token.strategy';

@Module({
  imports: [PrismaModule, PassportModule, UserModule],
  providers: [ApiTokenResolver, ApiTokenService, ApiTokenStrategy],
  exports: [ApiTokenService],
})
export class ApiTokenModule {}
