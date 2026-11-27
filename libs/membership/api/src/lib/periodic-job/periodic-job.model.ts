import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PeriodicJobStepStatus } from '@prisma/client';

registerEnumType(PeriodicJobStepStatus, {
  name: 'PeriodicJobStepStatus',
});

@ObjectType({ description: 'One number a step of the night reports.' })
export class PeriodicJobStepCount {
  @Field()
  name!: string;

  @Field(() => Int)
  value!: number;
}

@ObjectType({
  description:
    "What one step of a night did: the job's own steps and the syncs after it.",
})
export class PeriodicJobStep {
  @Field()
  key!: string;

  @Field(() => PeriodicJobStepStatus)
  status!: PeriodicJobStepStatus;

  @Field(() => [PeriodicJobStepCount])
  counts!: PeriodicJobStepCount[];

  @Field({ nullable: true })
  error?: string;

  @Field()
  startedAt!: Date;

  @Field()
  finishedAt!: Date;
}

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
