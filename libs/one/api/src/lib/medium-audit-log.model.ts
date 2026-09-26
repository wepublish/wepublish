import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { AuditLogAction, AuditLogActorType } from '@prisma/client';

@ObjectType()
export class MediumAuditLog {
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

  @Field(() => String, {
    nullable: true,
    description: 'Set when the actor was impersonating another user.',
  })
  impersonatedBy!: string | null;

  @Field()
  success!: boolean;

  @Field(() => String, { nullable: true })
  errorMessage!: string | null;
}

@InputType()
export class MediumAuditLogFilter {
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

  @Field(() => String, {
    nullable: true,
    description: 'Everything a single login session did.',
  })
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

  @Field(() => Boolean, { nullable: true })
  impersonatedOnly?: boolean;

  @Field(() => Date, { nullable: true })
  from?: Date;

  @Field(() => Date, { nullable: true })
  to?: Date;
}

@ObjectType()
export class MediumAuditLogPage {
  @Field(() => [MediumAuditLog])
  nodes!: MediumAuditLog[];

  @Field(() => Int)
  totalCount!: number;

  @Field({
    description:
      'False when this medium does not provide an audit log, in which case nodes is empty and totalCount is zero.',
  })
  supported!: boolean;
}
