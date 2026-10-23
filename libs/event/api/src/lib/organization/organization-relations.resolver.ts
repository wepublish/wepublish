import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthSession, CurrentUser } from '@wepublish/authentication/api';
import { Tag } from '@wepublish/tag/api';
import { organizationViewerPermissions } from '../event-scope';
import { EventAffiliation } from '../taxonomy/event-taxonomy.model';
import {
  OrganizationAffiliationsDataloader,
  OrganizationContactsDataloader,
  OrganizationTagsDataloader,
} from './organization-relations.dataloader';
import {
  BaseOrganization,
  OrganizationContact,
  OrganizationViewerPermissions,
} from './organization.model';

@Resolver(() => BaseOrganization)
export class OrganizationRelationsResolver {
  constructor(
    private tagsDataloader: OrganizationTagsDataloader,
    private affiliationsDataloader: OrganizationAffiliationsDataloader,
    private contactsDataloader: OrganizationContactsDataloader
  ) {}

  @ResolveField(() => [Tag])
  public async tags(@Parent() { id }: BaseOrganization) {
    return (await this.tagsDataloader.load(id)) ?? [];
  }

  @ResolveField(() => [EventAffiliation])
  public async affiliations(@Parent() { id }: BaseOrganization) {
    return (await this.affiliationsDataloader.load(id)) ?? [];
  }

  @ResolveField(() => [OrganizationContact])
  public async contacts(@Parent() { id }: BaseOrganization) {
    return (await this.contactsDataloader.load(id)) ?? [];
  }

  @ResolveField(() => OrganizationViewerPermissions, {
    description: `What you may do with this organisation.`,
  })
  public viewerCan(
    @Parent() { id }: BaseOrganization,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return organizationViewerPermissions(session, id);
  }
}
