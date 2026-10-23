import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Event as PEvent } from '@prisma/client';
import { AuthSession, CurrentUser } from '@wepublish/authentication/api';
import { canSeeOrganization } from './event-scope';
import { Event } from './event.model';
import { OrganizationDataloaderService } from './organization/organization-dataloader.service';
import { BaseOrganization } from './organization/organization.model';
import { PlaceDataloaderService } from './place/place-dataloader.service';
import { Place } from './place/place.model';
import { AudienceDataloader } from './taxonomy/event-taxonomy.dataloader';
import { EventAudience } from './taxonomy/event-taxonomy.model';

@Resolver(() => Event)
export class EventRelationsResolver {
  constructor(
    private places: PlaceDataloaderService,
    private audiences: AudienceDataloader,
    private organizations: OrganizationDataloaderService
  ) {}

  @ResolveField(() => Place, { nullable: true })
  public async place(@Parent() { placeId }: PEvent) {
    return placeId ? this.places.load(placeId) : null;
  }

  @ResolveField(() => EventAudience, { nullable: true })
  public async audience(@Parent() { audienceId }: PEvent) {
    return audienceId ? this.audiences.load(audienceId) : null;
  }

  @ResolveField(() => BaseOrganization, { nullable: true })
  public async organization(
    @Parent() { organizationId }: PEvent,
    @CurrentUser() session: AuthSession | undefined
  ) {
    if (!organizationId) {
      return null;
    }

    const organization = await this.organizations.load(organizationId);

    return organization && canSeeOrganization(session, organization) ?
        organization
      : null;
  }
}
