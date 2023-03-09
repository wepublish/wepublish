import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'

// Consent
import {ConsentService} from './consent/consent.service'
import {ConsentResolver} from './consent/consent.resolver'

// UserConsent
import {UserConsentService} from './userConsent/userConsent.service'
import {UserConsentResolver} from './userConsent/userConsent.resolver'

@Module({
  imports: [PrismaModule],
  providers: [ConsentService, ConsentResolver, UserConsentService, UserConsentResolver]
})
export class ConsentModule {}
