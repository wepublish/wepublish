import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PeriodicJob {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  date!: Date;

  @Field()
  tries!: number;

  @Field({ nullable: true })
  executionTime?: Date;

  @Field({ nullable: true })
  successfullyFinished?: Date;

  @Field({ nullable: true })
  finishedWithError?: Date;

  @Field({ nullable: true })
  error?: string;
}
