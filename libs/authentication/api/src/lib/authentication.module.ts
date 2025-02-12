import {Module} from '@nestjs/common'
import {PassportModule} from '@nestjs/passport'
import {SessionStrategy} from './session.strategy'
import {APP_GUARD} from '@nestjs/core'
import {OptionalAuthenticationGuard} from './optional-authentication.guard'
import {AuthenticationService} from './authentication.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {OneOfGuard} from './one-of.guard'
import {PublicGuard} from './public.guard'
import {AuthenticatedGuard} from './authenticated.guard'

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({
      defaultStrategy: 'session'
    })
  ],
  providers: [
    SessionStrategy,
    AuthenticationService,
    {
      provide: APP_GUARD,
      useClass: OptionalAuthenticationGuard
    },
    {
      provide: APP_GUARD,
      useClass: OneOfGuard
    },
    PublicGuard,
    AuthenticatedGuard
  ],
  exports: [AuthenticationService]
})
export class AuthenticationModule {}
