import { mockMutationResult } from '../apollo';
import {
  PollBlockContextProps,
  SubscribeBlockContextProps,
} from '@wepublish/block-content/website';
import { CommentRatingContextProps } from '@wepublish/comments/website';
import {
  CreateSubscriptionInfoQuery,
  PollVoteMutation,
  RateCommentMutation,
  RegisterMutation,
  ResubscribeMutation,
  SubscribeMutation,
  UpgradeMutation,
  UpgradeSubscriptionInfoQuery,
  UserPollVoteQuery,
} from '@wepublish/website/api';
import { vi } from 'vitest';
import { MockedResult, toApolloResult, toResultPromise } from './mocked-result';

export type TestPollBlockOptions = {
  fetchUserVoteResult?: MockedResult<UserPollVoteQuery>;
  voteResult?: MockedResult<PollVoteMutation>;
  anonymousVote?: string | null;
  canVoteAnonymously?: boolean;
};

export const createPollBlockContext = ({
  fetchUserVoteResult,
  voteResult,
  anonymousVote = null,
  canVoteAnonymously,
}: TestPollBlockOptions = {}) => ({
  vote: vi.fn<NonNullable<PollBlockContextProps['vote']>>(
    async () =>
      toApolloResult(voteResult) as Awaited<
        ReturnType<NonNullable<PollBlockContextProps['vote']>>
      >
  ),
  fetchUserVote: vi.fn<NonNullable<PollBlockContextProps['fetchUserVote']>>(
    () =>
      toResultPromise(toApolloResult(fetchUserVoteResult)) as ReturnType<
        NonNullable<PollBlockContextProps['fetchUserVote']>
      >
  ),
  getAnonymousVote: vi.fn<
    NonNullable<PollBlockContextProps['getAnonymousVote']>
  >(() => anonymousVote),
  canVoteAnonymously,
});

export type TestCommentRatingOptions = {
  rateResult?: MockedResult<RateCommentMutation>;
  anonymousRate?: number | null;
  canRateAnonymously?: boolean;
};

export const createCommentRatingContext = ({
  rateResult,
  anonymousRate = null,
  canRateAnonymously,
}: TestCommentRatingOptions = {}) => ({
  rate: vi.fn<NonNullable<CommentRatingContextProps['rate']>>(
    async () =>
      toApolloResult(rateResult) as Awaited<
        ReturnType<NonNullable<CommentRatingContextProps['rate']>>
      >
  ),
  getAnonymousRate: vi.fn<
    NonNullable<CommentRatingContextProps['getAnonymousRate']>
  >(() => anonymousRate),
  canRateAnonymously,
});

export type TestSubscribeBlockOptions = Partial<
  Pick<
    SubscribeBlockContextProps,
    | 'userSubscriptions'
    | 'userInvoices'
    | 'challenge'
    | 'redirectPages'
    | 'stripeClientSecret'
  > & {
    resubscribeResult: MockedResult<ResubscribeMutation>;
    subscribeResult: MockedResult<SubscribeMutation>;
    registerResult: MockedResult<RegisterMutation>;
    upgradeResult: MockedResult<UpgradeMutation>;
    upgradeInfoResult: MockedResult<UpgradeSubscriptionInfoQuery>;
    subscribeInfoResult: MockedResult<CreateSubscriptionInfoQuery>;
  }
>;

type SubscribeFn = SubscribeBlockContextProps['subscribe'];
type UpgradeFn = SubscribeBlockContextProps['upgrade'];
type ResubscribeFn = SubscribeBlockContextProps['resubscribe'][0];
type RegisterFn = SubscribeBlockContextProps['register'][0];
type FetchUpgradeInfoFn = SubscribeBlockContextProps['upgradeInfo'][0];
type FetchSubscribeInfoFn = SubscribeBlockContextProps['subscribeInfo'][0];

export const createSubscribeBlockContext = ({
  resubscribeResult,
  subscribeResult,
  registerResult,
  upgradeResult,
  upgradeInfoResult,
  subscribeInfoResult,
  redirectPages,
  stripeClientSecret,
  challenge = { data: undefined, loading: true },
  userInvoices = { data: undefined, loading: true },
  userSubscriptions = { data: undefined, loading: true },
}: TestSubscribeBlockOptions = {}) => {
  const subscribe = vi.fn<SubscribeFn>(
    async () =>
      toApolloResult(subscribeResult) as Awaited<ReturnType<SubscribeFn>>
  );
  const upgrade = vi.fn<UpgradeFn>(
    async () => toApolloResult(upgradeResult) as Awaited<ReturnType<UpgradeFn>>
  );
  const resubscribe = vi.fn<ResubscribeFn>(
    async () =>
      toApolloResult(resubscribeResult) as Awaited<ReturnType<ResubscribeFn>>
  );
  const register = vi.fn<RegisterFn>(
    async () =>
      toApolloResult(registerResult) as Awaited<ReturnType<RegisterFn>>
  );
  const fetchUpgradeInfo = vi.fn<FetchUpgradeInfoFn>(
    () =>
      toResultPromise(
        toApolloResult(upgradeInfoResult)
      ) as ReturnType<FetchUpgradeInfoFn>
  );
  const fetchSubscribeInfo = vi.fn<FetchSubscribeInfoFn>(
    () =>
      toResultPromise(
        toApolloResult(subscribeInfoResult)
      ) as ReturnType<FetchSubscribeInfoFn>
  );

  return {
    subscribe,
    upgrade,
    resubscribe: [
      resubscribe,
      mockMutationResult(toApolloResult(resubscribeResult)),
    ],
    register: [register, mockMutationResult(toApolloResult(registerResult))],
    upgradeInfo: [
      fetchUpgradeInfo,
      { ...toApolloResult(upgradeInfoResult), loading: false },
    ],
    subscribeInfo: [
      fetchSubscribeInfo,
      { ...toApolloResult(subscribeInfoResult), loading: false },
    ],
    redirectPages,
    stripeClientSecret,
    challenge,
    userInvoices,
    userSubscriptions,
  } as SubscribeBlockContextProps & {
    subscribe: typeof subscribe;
    upgrade: typeof upgrade;
    resubscribe: [
      typeof resubscribe,
      SubscribeBlockContextProps['resubscribe'][1],
    ];
    register: [typeof register, SubscribeBlockContextProps['register'][1]];
    upgradeInfo: [
      typeof fetchUpgradeInfo,
      SubscribeBlockContextProps['upgradeInfo'][1],
    ];
    subscribeInfo: [
      typeof fetchSubscribeInfo,
      SubscribeBlockContextProps['subscribeInfo'][1],
    ];
  };
};
