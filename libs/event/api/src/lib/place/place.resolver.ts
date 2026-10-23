import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Place as PPlace } from '@prisma/client';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import { CanUpdateOrganization } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { canSeeOrganization } from '../event-scope';
import { OrganizationDataloaderService } from '../organization/organization-dataloader.service';
import { BaseOrganization } from '../organization/organization.model';
import { RegionDataloader } from '../taxonomy/event-taxonomy.dataloader';
import { EventRegion } from '../taxonomy/event-taxonomy.model';
import {
  CreatePlaceInput,
  PaginatedPlaces,
  Place,
  PlaceArgs,
  PlaceListArgs,
  UpdatePlaceInput,
} from './place.model';
import { PlaceService } from './place.service';

type Session = AuthSession | undefined;

@Resolver(() => Place)
export class PlaceResolver {
  constructor(
    private placeService: PlaceService,
    private regions: RegionDataloader,
    private organizations: OrganizationDataloaderService
  ) {}

  @Public()
  @Query(() => Place, {
    description: `Returns a place by id or slug. Disabled places are returned to members of their organisation and to whoever may read any organisation.`,
  })
  public place(@Args() args: PlaceArgs, @CurrentUser() session: Session) {
    return this.placeService.getPlace(args, session);
  }

  @Public()
  @Query(() => PaginatedPlaces, {
    description: `Returns a paginated list of places based on the filters given.`,
  })
  public places(@Args() args: PlaceListArgs, @CurrentUser() session: Session) {
    return this.placeService.getPlaces(args, session);
  }

  @Permissions(CanUpdateOrganization)
  @Mutation(() => Place, {
    description: `Creates a place for an organisation you are a member of, or for any or none with CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  public createPlace(
    @Args() input: CreatePlaceInput,
    @CurrentUser() session: Session
  ) {
    return this.placeService.createPlace(input, session);
  }

  @Permissions(CanUpdateOrganization)
  @Mutation(() => Place, {
    description: `Updates a place of an organisation you are a member of, or any with CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  public updatePlace(
    @Args() input: UpdatePlaceInput,
    @CurrentUser() session: Session
  ) {
    return this.placeService.updatePlace(input, session);
  }

  @Permissions(CanUpdateOrganization)
  @Mutation(() => Place, {
    description: `Deletes a place without upcoming events, of an organisation you are a member of, or any with CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  public deletePlace(@Args('id') id: string, @CurrentUser() session: Session) {
    return this.placeService.deletePlace(id, session);
  }

  @ResolveField(() => EventRegion, { nullable: true })
  public async region(@Parent() { regionId }: PPlace) {
    return regionId ? this.regions.load(regionId) : null;
  }

  @ResolveField(() => BaseOrganization, { nullable: true })
  public async organization(
    @Parent() { organizationId }: PPlace,
    @CurrentUser() session: Session
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
