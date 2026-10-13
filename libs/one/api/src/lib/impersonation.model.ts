import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ImpersonationUser {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => [String])
  roles!: string[];

  @Field()
  active!: boolean;
}

@ObjectType()
export class ImpersonationGrantResult {
  @Field()
  token!: string;

  @Field(() => Date)
  expiresAt!: Date;

  @Field(() => Int)
  durationMinutes!: number;

  @Field()
  email!: string;
}

@ObjectType()
export class ImpersonationSessionInfo {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  expiresAt!: Date;

  @Field(() => String, { nullable: true })
  impersonatedBy!: string | null;

  @Field(() => String, { nullable: true })
  impersonationReason!: string | null;

  @Field()
  userId!: string;

  @Field()
  userEmail!: string;

  @Field(() => String, { nullable: true })
  userName!: string | null;
}
