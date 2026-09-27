import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * One row of the database's migration history, as the dashboard shows it.
 *
 * The error text comes straight from what Prisma recorded when the migration
 * failed — it is the only description of what actually went wrong, so it is
 * passed through rather than summarised.
 */
@ObjectType()
export class MediumMigration {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ description: 'applied, failed, rolledBack or running' })
  state!: string;

  @Field(() => Date)
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  finishedAt!: Date | null;

  @Field(() => Date, { nullable: true })
  rolledBackAt!: Date | null;

  @Field(() => Int)
  appliedStepsCount!: number;

  @Field(() => String, { nullable: true })
  error!: string | null;
}
