import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  InterfaceType,
  ObjectType,
  PartialType,
  registerEnumType,
} from '@nestjs/graphql';
import { AuthSession } from '@wepublish/authentication/api';
import { Tag } from '@wepublish/tag/api';
import { User } from '@wepublish/user/api';
import { GraphQLSlug, PaginatedType, SortOrder } from '@wepublish/utils/api';
import { canReadOrganizationSensitiveData } from '../event-scope';
import {
  EventAffiliation,
  EventRegion,
} from '../taxonomy/event-taxonomy.model';

export enum OrganizationSort {
  Name = 'Name',
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(OrganizationSort, {
  name: 'OrganizationSort',
});

@ObjectType()
export class OrganizationContact {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;
}

@InputType()
export class OrganizationContactInput {
  @Field(() => String, { nullable: true })
  label?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;
}

@ObjectType({
  description: `What the caller may do with an organisation, by the same rules the mutations apply.`,
})
export class OrganizationViewerPermissions {
  @Field()
  update!: boolean;

  @Field({ description: `Changing partner and enabled.` })
  updatePrivileged!: boolean;

  @Field()
  delete!: boolean;

  @Field({ description: `Adding and removing members.` })
  manageMembers!: boolean;
}

@InterfaceType({
  resolveType: (
    organization: BaseOrganization,
    context: { req?: { user?: AuthSession } } | undefined
  ) =>
    canReadOrganizationSensitiveData(context?.req?.user, organization.id) ?
      SensitiveDataOrganization
    : Organization,
})
export class BaseOrganization {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field(() => String, { nullable: true })
  subTitle?: string | null;

  @Field(() => String, { nullable: true })
  about?: string | null;

  @Field(() => String, { nullable: true })
  website?: string | null;

  @Field(() => String, { nullable: true })
  legalStatus?: string | null;

  @Field()
  enabled!: boolean;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  zip?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => Float, { nullable: true })
  latitude?: number | null;

  @Field(() => Float, { nullable: true })
  longitude?: number | null;

  @Field(() => String, { nullable: true })
  regionId?: string | null;

  @Field(() => EventRegion, { nullable: true })
  region?: EventRegion | null;

  @Field(() => [Tag], { description: `Event tags, at most 3.` })
  tags?: Tag[];

  @Field(() => [EventAffiliation])
  affiliations?: EventAffiliation[];

  @Field(() => [OrganizationContact], { description: `At most 6.` })
  contacts?: OrganizationContact[];

  @Field(() => OrganizationViewerPermissions)
  viewerCan?: OrganizationViewerPermissions;
}

@ObjectType({
  implements: [BaseOrganization],
})
export class Organization extends BaseOrganization {}

@ObjectType({
  implements: [BaseOrganization],
  description: `Only resolved for members of the organization and for whoever may read or update any organization.`,
})
export class SensitiveDataOrganization extends BaseOrganization {
  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  partner!: boolean;

  @Field()
  createdByMigration!: boolean;

  @Field(() => String, { nullable: true })
  postOfficeBox?: string | null;

  @Field(() => [OrganizationMember])
  members?: OrganizationMember[];
}

@ObjectType()
export class OrganizationMember {
  @Field()
  userId!: string;

  @Field()
  organizationId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field(() => BaseOrganization, { nullable: true })
  organization?: BaseOrganization | null;
}

@ObjectType()
export class PaginatedOrganizations extends PaginatedType(BaseOrganization) {}

@InputType()
export class OrganizationFilter {
  @Field({ nullable: true })
  name?: string;

  @Field(() => [String], { nullable: true })
  ids?: string[];

  @Field({
    nullable: true,
    description: `Needs CAN_GET_OTHER_ORGANIZATIONS or CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  partner?: boolean;

  @Field({ nullable: true })
  enabled?: boolean;

  @Field({ nullable: true })
  regionId?: string;

  @Field({
    nullable: true,
    description: `Needs CAN_GET_OTHER_ORGANIZATIONS or CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  createdByMigration?: boolean;

  @Field({
    nullable: true,
    description: `Only the organizations you are a member of.`,
  })
  mine?: boolean;

  @Field({
    nullable: true,
    description: `Organizations with or without members. Needs CAN_GET_OTHER_ORGANIZATIONS or CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  hasMembers?: boolean;
}

@ArgsType()
export class OrganizationListArgs {
  @Field(() => OrganizationFilter, { nullable: true })
  filter?: OrganizationFilter;

  @Field(() => OrganizationSort, {
    nullable: true,
    defaultValue: OrganizationSort.Name,
  })
  sort?: OrganizationSort;

  @Field(() => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@ArgsType()
export class OrganizationArgs {
  @Field({ nullable: true })
  id?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string;
}

@ArgsType()
export class CreateOrganizationInput {
  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field(() => String, { nullable: true })
  subTitle?: string | null;

  @Field(() => String, { nullable: true })
  about?: string | null;

  @Field(() => String, { nullable: true })
  website?: string | null;

  @Field(() => String, { nullable: true })
  legalStatus?: string | null;

  @Field({
    nullable: true,
    description: `Needs CAN_UPDATE_OTHER_ORGANIZATIONS to change.`,
  })
  enabled?: boolean;

  @Field({
    nullable: true,
    description: `Needs CAN_UPDATE_OTHER_ORGANIZATIONS to change.`,
  })
  partner?: boolean;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  postOfficeBox?: string | null;

  @Field(() => String, { nullable: true })
  zip?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => Float, { nullable: true })
  latitude?: number | null;

  @Field(() => Float, { nullable: true })
  longitude?: number | null;

  @Field(() => String, { nullable: true })
  regionId?: string | null;

  @Field(() => [String], {
    nullable: true,
    description: `Event tags, at most 3. Replaces the stored ones.`,
  })
  tagIds?: string[] | null;

  @Field(() => [String], {
    nullable: true,
    description: `Replaces the stored ones.`,
  })
  affiliationIds?: string[] | null;

  @Field(() => [OrganizationContactInput], {
    nullable: true,
    description: `At most 6, each with an email or a phone. Replaces the stored ones.`,
  })
  contacts?: OrganizationContactInput[] | null;
}

@ArgsType()
export class UpdateOrganizationInput extends PartialType(
  CreateOrganizationInput,
  ArgsType
) {
  @Field()
  id!: string;
}

@ArgsType()
export class OrganizationMemberArgs {
  @Field()
  organizationId!: string;

  @Field()
  userId!: string;
}
