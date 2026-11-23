import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description: 'A printed issue a subscription received: a list handed to the printshop.',
})
export class ReceivedPrintIssue {
  @Field({ description: 'As the medium writes it, e.g. «6.26» or «#117».' })
  label!: string;

  @Field({ description: 'The ship day (YYYY-MM-DD).' })
  issueDate!: string;

  @Field(() => Int, { description: '0 = the print list, n = Nachlieferung n.' })
  batch!: number;

  @Field({ description: 'When the list went to the printshop.' })
  deliveredAt!: string;

  @Field(() => Int, { description: 'How many issues it counts as: 2 for a double issue.' })
  countsAs!: number;
}

@ObjectType({
  description:
    "How many of the printed issues a subscription paid for it received, as the print export counts: the running period, else the latest paid one.",
})
export class PrintIssueProgress {
  @Field()
  subscriptionId!: string;

  @Field()
  periodId!: string;

  @Field(() => Int, {
    description: 'Copies received in that period, historic issues inside it included.',
  })
  received!: number;

  @Field(() => Int, {
    nullable: true,
    description: 'What the period is worth; null = unlimited (lifetime).',
  })
  entitled!: number | null;

  @Field(() => Int, { description: 'Still to send, never below 0.' })
  owed!: number;

  @Field({
    description:
      'Running, or ended and still owed copies within the time of two issues.',
  })
  relevant!: boolean;

  @Field(() => [ReceivedPrintIssue])
  issues!: ReceivedPrintIssue[];
}
