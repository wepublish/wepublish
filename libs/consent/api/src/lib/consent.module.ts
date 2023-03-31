import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'

// Consent
import {ConsentService} from './consent/consent.service'
import {ConsentResolver} from './consent/consent.resolver'

// UserConsent
import {UserConsentService} from './userConsent/user-consent.service'
import {UserConsentResolver} from './userConsent/user-consent.resolver'

@Module({
  imports: [PrismaModule],
  providers: [ConsentService, ConsentResolver, UserConsentService, UserConsentResolver]
})
export class ConsentModule {}
