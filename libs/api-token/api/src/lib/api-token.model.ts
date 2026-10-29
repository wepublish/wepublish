import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

export enum ApiTokenSort {
  CreatedAt = 'CreatedAt',
  LastUsedAt = 'LastUsedAt',
  Name = 'Name',
}

registerEnumType(ApiTokenSort, {
  name: 'ApiTokenSort',
});

export enum ApiTokenStatus {
  Active = 'Active',
  Expired = 'Expired',
  Revoked = 'Revoked',
}

registerEnumType(ApiTokenStatus, {
  name: 'ApiTokenStatus',
  description: `A revoked token counts as revoked even once it has also expired.`,
});

@ObjectType()
export class ApiToken {
  @Field(() => String)
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field(() => String)
  name!: string;

  @Field(() => String, {
    description: `The non-secret start of the token`,
  })
  prefix!: string;

  @Field(() => [String], {
    description: `The permissions this token carries.`,
  })
  scopes!: string[];

  @Field(() => Date, {
    description: `When the token stops working.`,
  })
  expiresAt!: Date;

  @Field(() => Date, { nullable: true })
  revokedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastUsedAt?: Date | null;

  @Field(() => String, { nullable: true })
  createdById?: string | null;
}

@ObjectType({
  description: `A newly created token. The secret is returned exactly once and cannot be retrieved again.`,
})
export class CreatedApiToken {
  @Field(() => ApiToken)
  apiToken!: ApiToken;

  @Field(() => String, {
    description: `The secret.`,
  })
  token!: string;
}

@ObjectType()
export class PaginatedApiTokens extends PaginatedType(ApiToken) {}

@ArgsType()
export class ApiTokenListArgs {
  @Field(() => ApiTokenSort, {
    nullable: true,
    defaultValue: ApiTokenSort.CreatedAt,
  })
  sort?: ApiTokenSort;

  @Field(() => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Descending,
  })
  order?: SortOrder;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;

  @Field({
    nullable: true,
    description: `Only tokens created by this user. Ignored without CAN_GET_ALL_API_TOKENS, which already limits you to your own.`,
  })
  createdById?: string;

  @Field(() => ApiTokenStatus, { nullable: true })
  status?: ApiTokenStatus;
}

@ArgsType()
export class CreateApiTokenArgs extends PickType(
  ApiToken,
  ['name', 'scopes', 'expiresAt'] as const,
  ArgsType
) {}
