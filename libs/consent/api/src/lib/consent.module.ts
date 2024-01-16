import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {ConsentResolver} from './consent/consent.resolver'
import {ConsentService} from './consent/consent.service'
import {UserConsentResolver} from './user-consent/user-consent.resolver'
import {UserConsentService} from './user-consent/user-consent.service'

@Module({
  imports: [PrismaModule],
  providers: [ConsentService, ConsentResolver, UserConsentService, UserConsentResolver]
})
export class ConsentModule {}
