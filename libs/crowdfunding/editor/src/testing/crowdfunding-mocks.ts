import type { MockLink } from '@apollo/client/testing';
import {
  CreateCrowdfundingDocument,
  type CreateCrowdfundingMutation,
  type CreateCrowdfundingMutationVariables,
  CrowdfundingDocument,
  CrowdfundingGoalType,
  type CrowdfundingQuery,
  type FullCrowdfundingFragment,
  UpdateCrowdfundingDocument,
  type UpdateCrowdfundingMutation,
  type UpdateCrowdfundingMutationVariables,
} from '@wepublish/editor/api';
import {
  memberPlanFixture,
  memberPlanListMock,
} from '@wepublish/form/editor/testing';

type Mock = MockLink.MockedResponse;

export const monthly = memberPlanFixture('plan-monthly', 'Monatsabo');
export const yearly = memberPlanFixture('plan-yearly', 'Jahresabo');

export const storedCrowdfunding: FullCrowdfundingFragment = {
  __typename: 'Crowdfunding',
  id: 'crowdfunding-1',
  name: 'Rettet die Zeitung',
  countSubscriptionsFrom: '2026-01-01T08:00:00.000Z',
  countSubscriptionsUntil: '2026-03-31T18:30:00.000Z',
  additionalRevenue: 25,
  revenue: 480000,
  goalType: CrowdfundingGoalType.Subscription,
  subscriptions: 120,
  goals: [
    {
      __typename: 'CrowdfundingGoal',
      id: 'goal-1',
      title: 'Basis',
      description: 'Die Grundfinanzierung',
      amount: 300,
    },
    {
      __typename: 'CrowdfundingGoal',
      id: 'goal-2',
      title: 'Ausbau',
      description: null,
      amount: 500,
    },
  ],
  activeGoal: {
    __typename: 'CrowdfundingGoalWithProgress',
    id: 'goal-1',
    title: 'Basis',
    description: 'Die Grundfinanzierung',
    amount: 300,
    progress: 40,
  },
  memberPlans: [{ __typename: 'MemberPlan', id: monthly.id }],
};

export const wireFormat = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function crowdfundingMock(crowdfunding: FullCrowdfundingFragment): Mock {
  const data: CrowdfundingQuery = { __typename: 'Query', crowdfunding };

  return {
    request: {
      query: CrowdfundingDocument,
      variables: { id: crowdfunding.id },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function crowdfundingErrorMock(id: string, message: string): Mock {
  return {
    request: { query: CrowdfundingDocument, variables: { id } },
    error: new Error(message),
  };
}

const savedGoals = (
  goals: CreateCrowdfundingMutationVariables['input']['goals']
): FullCrowdfundingFragment['goals'] =>
  (goals ?? []).map((goal, index) => ({
    __typename: 'CrowdfundingGoal',
    id: `goal-new-${index}`,
    title: goal.title,
    description: goal.description ?? null,
    amount: goal.amount,
  }));

export function createCrowdfundingMock(
  onRequest: (variables: CreateCrowdfundingMutationVariables) => void,
  id = 'crowdfunding-new'
): Mock {
  return {
    request: { query: CreateCrowdfundingDocument, variables: () => true },
    result: (variables: CreateCrowdfundingMutationVariables) => {
      onRequest(variables);

      const { input } = variables;
      const data: CreateCrowdfundingMutation = {
        __typename: 'Mutation',
        createCrowdfunding: {
          ...storedCrowdfunding,
          id,
          name: input.name,
          goalType: input.goalType,
          additionalRevenue: input.additionalRevenue ?? null,
          countSubscriptionsFrom: input.countSubscriptionsFrom ?? null,
          countSubscriptionsUntil: input.countSubscriptionsUntil ?? null,
          goals: savedGoals(input.goals),
          activeGoal: null,
          memberPlans: (input.memberPlans ?? []).map(plan => ({
            __typename: 'MemberPlan',
            id: plan.id,
          })),
        },
      };

      return { data };
    },
  };
}

export function updateCrowdfundingMock(
  onRequest: (variables: UpdateCrowdfundingMutationVariables) => void,
  saved: FullCrowdfundingFragment = storedCrowdfunding
): Mock {
  return {
    request: { query: UpdateCrowdfundingDocument, variables: () => true },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: UpdateCrowdfundingMutationVariables) => {
      onRequest(variables);

      const data: UpdateCrowdfundingMutation = {
        __typename: 'Mutation',
        updateCrowdfunding: saved,
      };

      return { data };
    },
  };
}

export function failingMutationMock(
  document:
    | typeof CreateCrowdfundingDocument
    | typeof UpdateCrowdfundingDocument,
  message: string
): Mock {
  return {
    request: { query: document, variables: () => true },
    error: new Error(message),
  };
}

export const pickerMocks = (): Mock[] => [
  memberPlanListMock([monthly, yearly]),
];
