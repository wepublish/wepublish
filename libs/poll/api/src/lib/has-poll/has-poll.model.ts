import { Field, InterfaceType } from '@nestjs/graphql';
import { FullPoll } from '../poll.model';

@InterfaceType()
export abstract class HasOptionalPoll {
  @Field({ nullable: true })
  pollId?: string;

  @Field(() => FullPoll, { nullable: true })
  poll?: FullPoll;
}

@InterfaceType()
export abstract class HasPoll {
  @Field()
  pollId!: string;

  @Field(() => FullPoll)
  poll!: FullPoll;
}
