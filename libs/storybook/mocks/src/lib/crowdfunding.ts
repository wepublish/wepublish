import {CrowdfundingWithActiveGoal} from '@wepublish/website/api'
import nanoid from 'nanoid'

export const mockCrowdfunding = () =>
  ({
    __typename: 'CrowdfundingWithActiveGoal',
    id: nanoid(),
    name: 'super crowdfunding',
    activeCrowdfundingGoal: {
      __typename: 'CrowdfundingGoalWithProgress',
      id: nanoid(),
      title: 'We will start the new media',
      description: 'Lorem ipsum',
      amount: 40000 * 1000,
      progress: 73
    }
  } as CrowdfundingWithActiveGoal)
