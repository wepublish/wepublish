import {
  CrowdfundingGoalType,
  FullCrowdfundingFragment,
} from '@wepublish/website/api';
import { faker } from './faker';
import { definedOnly } from './overrides';

type CrowdfundingGoal = NonNullable<FullCrowdfundingFragment['activeGoal']>;

export const mockCrowdfundingGoal = (
  overrides: Partial<CrowdfundingGoal> = {}
): CrowdfundingGoal => ({
  __typename: 'CrowdfundingGoalWithProgress',
  id: faker.string.nanoid(),
  title: 'We will start the new media',
  description: 'Lorem ipsum',
  amount: 100000 * 100,
  progress: 73,
  ...definedOnly(overrides),
});

export const mockCrowdfunding = ({
  activeGoal = mockCrowdfundingGoal(),
  ...overrides
}: Partial<FullCrowdfundingFragment> = {}): FullCrowdfundingFragment => ({
  __typename: 'Crowdfunding',
  id: faker.string.nanoid(),
  name: 'super crowdfunding',
  goalType: CrowdfundingGoalType.Revenue,
  revenue: 73000 * 100,
  subscriptions: 120,
  countSubscriptionsUntil: null,
  activeGoal,
  ...definedOnly(overrides),
});
