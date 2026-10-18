import {
  ArgsType,
  Field,
  Int,
  ObjectType,
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

@ObjectType()
export class ApiToken {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => String, {
    description: `The non-secret start of the token, so a key can be told apart from another without revealing it.`,
  })
  prefix!: string;

  @Field(() => [String], {
    description: `The permissions this token carries. Bounded at creation by what its creator holds.`,
  })
  scopes!: string[];

  @Field(() => Date, { nullable: true })
  expiresAt?: Date | null;

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
    description: `The secret. Store it now — it is never shown again.`,
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
}

@ArgsType()
export class CreateApiTokenArgs {
  @Field()
  name!: string;

  @Field(() => [String])
  scopes!: string[];

  @Field(() => Date, { nullable: true })
  expiresAt?: Date | null;
}
