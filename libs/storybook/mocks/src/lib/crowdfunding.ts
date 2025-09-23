import { CrowdfundingWithActiveGoal } from '@wepublish/website/api';
import nanoid from 'nanoid';

export const mockCrowdfunding = () =>
  ({
    __typename: 'CrowdfundingWithActiveGoal',
    id: nanoid(),
    name: 'super crowdfunding',
    revenue: 73000 * 100,
    activeCrowdfundingGoal: {
      __typename: 'CrowdfundingGoalWithProgress',
      id: nanoid(),
      title: 'We will start the new media',
      description: 'Lorem ipsum',
      amount: 100000 * 100,
      progress: 73,
    },
  }) as CrowdfundingWithActiveGoal;
