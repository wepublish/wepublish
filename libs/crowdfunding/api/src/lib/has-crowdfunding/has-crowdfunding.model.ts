import {Field, InterfaceType} from '@nestjs/graphql'
import {CrowdfundingWithActiveGoal} from '../crowdfunding.model'

@InterfaceType()
export abstract class HasCrowdfunding {
  @Field()
  crowdfundingId!: string

  @Field(() => CrowdfundingWithActiveGoal)
  crowdfunding!: CrowdfundingWithActiveGoal
}

@InterfaceType()
export abstract class HasOptionalCrowdfunding {
  @Field({nullable: true})
  crowdfundingId?: string

  @Field(() => CrowdfundingWithActiveGoal, {nullable: true})
  crowdfunding?: CrowdfundingWithActiveGoal
}
