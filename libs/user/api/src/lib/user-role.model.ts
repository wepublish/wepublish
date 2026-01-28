import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { Permission } from '@wepublish/permissions/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

export enum UserRoleSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

registerEnumType(UserRoleSort, {
  name: 'UserRoleSort',
});

@ObjectType()
export class UserRole {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  systemRole!: boolean;

  @Field(() => [String])
  permissionIDs?: string[];
  @Field(() => [Permission])
  permissions!: Permission[];
}

@ObjectType()
export class PaginatedUserRoles extends PaginatedType(UserRole) {}

@InputType()
export class UserRoleFilter {
  @Field({ nullable: true })
  name?: string;
}

@ArgsType()
export class UserRoleListArgs {
  @Field(type => UserRoleFilter, { nullable: true })
  filter?: UserRoleFilter;

  @Field(type => UserRoleSort, {
    nullable: true,
    defaultValue: UserRoleSort.CreatedAt,
  })
  sort?: UserRoleSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@ArgsType()
export class CreateUserRoleInput extends PickType(
  UserRole,
  ['name', 'description', 'permissionIDs'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateUserRoleInput extends PartialType(
  CreateUserRoleInput,
  ArgsType
) {
  @Field()
  id!: string;
}
