import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  PartialType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLSlug, PaginatedType, SortOrder } from '@wepublish/utils/api';
import { GraphQLJSON } from 'graphql-type-json';
import { GeoBoundingBox } from '../geo-bounding-box';
import { BaseOrganization } from '../organization/organization.model';
import { EventRegion } from '../taxonomy/event-taxonomy.model';

export enum PlaceSort {
  Name = 'Name',
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(PlaceSort, {
  name: 'PlaceSort',
});

@ObjectType({
  description: `What the caller may do with a place, by the same rules the mutations apply.`,
})
export class PlaceViewerPermissions {
  @Field()
  update!: boolean;

  @Field({
    description: `A place with upcoming events is still refused on delete.`,
  })
  delete!: boolean;
}

@ObjectType()
export class Place {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field()
  enabled!: boolean;

  @Field({
    description: `A private place is offered in the event form only to members of its organisation. It stays publicly readable.`,
  })
  private!: boolean;

  @Field()
  address!: string;

  @Field()
  zip!: string;

  @Field()
  city!: string;

  @Field(() => Float, { nullable: true })
  latitude?: number | null;

  @Field(() => Float, { nullable: true })
  longitude?: number | null;

  @Field(() => String, { nullable: true })
  about?: string | null;

  @Field(() => String, { nullable: true })
  capacity?: string | null;

  @Field(() => String, { nullable: true })
  website?: string | null;

  @Field()
  wheelchairAccessible!: boolean;

  @Field()
  wheelchairAccessibleToilets!: boolean;

  @Field()
  wheelchairAccessibleParking!: boolean;

  @Field(() => String, { nullable: true })
  proInfirmisIdSource?: string | null;

  @Field(() => String, { nullable: true })
  proInfirmisDetailUrl?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  proInfirmisPictograms?: unknown;

  @Field(() => String, { nullable: true })
  regionId?: string | null;

  @Field(() => EventRegion, { nullable: true })
  region?: EventRegion | null;

  @Field(() => String, { nullable: true })
  organizationId?: string | null;

  @Field(() => BaseOrganization, { nullable: true })
  organization?: BaseOrganization | null;

  @Field(() => PlaceViewerPermissions)
  viewerCan?: PlaceViewerPermissions;
}

@ObjectType()
export class PaginatedPlaces extends PaginatedType(Place) {}

@InputType()
export class PlaceFilter {
  @Field({ nullable: true, description: `Matches the name.` })
  search?: string;

  @Field({ nullable: true })
  regionId?: string;

  @Field({ nullable: true })
  organizationId?: string;

  @Field({ nullable: true })
  enabled?: boolean;

  @Field({
    nullable: true,
    description: `Only the places you may file an event at: enabled ones that are not private or belong to your organisation.`,
  })
  selectable?: boolean;

  @Field({
    nullable: true,
    description: `Only the places of the organisations you are a member of.`,
  })
  mine?: boolean;

  @Field(() => GeoBoundingBox, { nullable: true })
  geoBoundingBox?: GeoBoundingBox;
}

@ArgsType()
export class PlaceListArgs {
  @Field(() => PlaceFilter, { nullable: true })
  filter?: PlaceFilter;

  @Field(() => PlaceSort, {
    nullable: true,
    defaultValue: PlaceSort.Name,
  })
  sort?: PlaceSort;

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
export class PlaceArgs {
  @Field({ nullable: true })
  id?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string;
}

@ArgsType()
export class CreatePlaceInput {
  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field({ nullable: true })
  enabled?: boolean;

  @Field({ nullable: true })
  private?: boolean;

  @Field()
  address!: string;

  @Field()
  zip!: string;

  @Field()
  city!: string;

  @Field(() => Float, { nullable: true })
  latitude?: number | null;

  @Field(() => Float, { nullable: true })
  longitude?: number | null;

  @Field(() => String, { nullable: true })
  about?: string | null;

  @Field(() => String, { nullable: true })
  capacity?: string | null;

  @Field(() => String, { nullable: true })
  website?: string | null;

  @Field({ nullable: true })
  wheelchairAccessible?: boolean;

  @Field({ nullable: true })
  wheelchairAccessibleToilets?: boolean;

  @Field({ nullable: true })
  wheelchairAccessibleParking?: boolean;

  @Field(() => String, { nullable: true })
  proInfirmisIdSource?: string | null;

  @Field(() => String, { nullable: true })
  regionId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: `An organisation you are a member of. Any organisation, or none, needs CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  organizationId?: string | null;
}

@ArgsType()
export class UpdatePlaceInput extends PartialType(CreatePlaceInput, ArgsType) {
  @Field()
  id!: string;
}
