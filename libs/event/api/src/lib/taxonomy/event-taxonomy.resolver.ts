import { Query, Resolver } from '@nestjs/graphql';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import {
  EventAffiliation,
  EventAudience,
  EventRegion,
} from './event-taxonomy.model';
import { EventTaxonomyService } from './event-taxonomy.service';

@Resolver()
export class EventTaxonomyResolver {
  constructor(private taxonomyService: EventTaxonomyService) {}

  @Public()
  @Query(() => [EventRegion], {
    description: `Returns the enabled regions, and the disabled ones too for CAN_GET_OTHER_ORGANIZATIONS or CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  public eventRegions(@CurrentUser() session: AuthSession | undefined) {
    return this.taxonomyService.getRegions(session);
  }

  @Public()
  @Query(() => [EventAudience], {
    description: `Returns the audiences an event can be for.`,
  })
  public eventAudiences() {
    return this.taxonomyService.getAudiences();
  }

  @Public()
  @Query(() => [EventAffiliation], {
    description: `Returns the affiliations an organisation can have.`,
  })
  public eventAffiliations() {
    return this.taxonomyService.getAffiliations();
  }
}
