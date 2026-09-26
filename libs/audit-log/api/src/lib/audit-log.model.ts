import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { AuditLogAction, AuditLogActorType } from '@prisma/client';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

registerEnumType(AuditLogAction, { name: 'AuditLogAction' });
registerEnumType(AuditLogActorType, { name: 'AuditLogActorType' });

@ObjectType()
export class AuditLog {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field()
  mutation!: string;

  @Field(() => AuditLogAction)
  action!: AuditLogAction;

  @Field(() => String, { nullable: true })
  entity!: string | null;

  @Field(() => String, { nullable: true })
  recordId!: string | null;

  @Field(() => AuditLogActorType)
  actorType!: AuditLogActorType;

  @Field(() => String, { nullable: true })
  userID!: string | null;

  @Field(() => String, { nullable: true })
  userEmail!: string | null;

  @Field(() => String, { nullable: true })
  tokenName!: string | null;

  @Field(() => String, { nullable: true })
  sessionID!: string | null;

  @Field(() => String, { nullable: true })
  impersonatedBy!: string | null;

  @Field()
  success!: boolean;

  @Field(() => String, { nullable: true })
  errorMessage!: string | null;
}

@ObjectType()
export class PaginatedAuditLogs extends PaginatedType(AuditLog) {
  @Field({
    description:
      'False when this installation does not provide an audit log, in which case nodes is empty and totalCount is zero.',
  })
  supported!: boolean;
}

@InputType()
export class AuditLogFilter {
  @Field(() => String, {
    nullable: true,
    description:
      'Case insensitive search across mutation, entity, record id, user email and token name.',
  })
  search?: string;

  @Field(() => String, { nullable: true })
  userID?: string;

  @Field(() => String, { nullable: true })
  userEmail?: string;

  @Field(() => String, { nullable: true })
  sessionID?: string;

  @Field(() => String, { nullable: true })
  entity?: string;

  @Field(() => String, { nullable: true })
  recordId?: string;

  @Field(() => String, { nullable: true })
  mutation?: string;

  @Field(() => [AuditLogAction], { nullable: true })
  actions?: AuditLogAction[];

  @Field(() => AuditLogActorType, { nullable: true })
  actorType?: AuditLogActorType;

  @Field(() => Boolean, { nullable: true })
  success?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Only entries where the actor was impersonating another user.',
  })
  impersonatedOnly?: boolean;

  @Field(() => Date, { nullable: true })
  from?: Date;

  @Field(() => Date, { nullable: true })
  to?: Date;
}

export enum AuditLogSort {
  CreatedAt = 'CreatedAt',
}

registerEnumType(AuditLogSort, { name: 'AuditLogSort' });

@ArgsType()
export class AuditLogListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => AuditLogFilter, {
    nullable: true,
    description: 'Filter for audit logs',
  })
  filter?: AuditLogFilter;

  @Field(() => AuditLogSort, {
    defaultValue: AuditLogSort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: AuditLogSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}
