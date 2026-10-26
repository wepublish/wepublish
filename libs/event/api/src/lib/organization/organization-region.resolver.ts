import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { RegionDataloader } from '../taxonomy/event-taxonomy.dataloader';
import { EventRegion } from '../taxonomy/event-taxonomy.model';
import { BaseOrganization } from './organization.model';

@Resolver(() => BaseOrganization)
export class OrganizationRegionResolver {
  constructor(private regions: RegionDataloader) {}

  @ResolveField(() => EventRegion, { nullable: true })
  public async region(@Parent() { regionId }: BaseOrganization) {
    return regionId ? this.regions.load(regionId) : null;
  }
}
