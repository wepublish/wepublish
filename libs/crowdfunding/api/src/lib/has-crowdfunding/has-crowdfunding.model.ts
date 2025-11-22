import { Field, InterfaceType } from '@nestjs/graphql';
import { Crowdfunding } from '../crowdfunding.model';

@InterfaceType()
export abstract class HasCrowdfunding {
  @Field()
  crowdfundingId!: string;

  @Field(() => Crowdfunding)
  crowdfunding!: Crowdfunding;
}

@InterfaceType()
export abstract class HasOptionalCrowdfunding {
  @Field({ nullable: true })
  crowdfundingId?: string;

  @Field(() => Crowdfunding, { nullable: true })
  crowdfunding?: Crowdfunding;
}
