import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
import type { useMutation } from '@apollo/client/react';
import type { MockLink } from '@apollo/client/testing';
import {
  ChallengeDocument,
  ChallengeQuery,
  EngagementPromptsDocument,
  FullEngagementPromptFragment,
  CheckLoginOtpDocument,
  FullBannerFragment,
  FullPeerProfileFragment,
  FullSettingFragment,
  PeerProfileDocument,
  PrimaryBannerDocument,
  SettingListDocument,
} from '@wepublish/website/api';
import type { GraphQLFormattedError } from 'graphql';
import { mockChallenge } from './challenge';
import { mockPeerProfile } from './peer';

type VariableMatcher<TVariables> = (variables: TVariables) => boolean;

export type MockOperationOptions<TData, TVariables> = {
  variables?: TVariables | VariableMatcher<TVariables>;
  maxUsageCount?: number;
  delay?: number;
} & (
  | { data: TData; errors?: never }
  | { errors: ReadonlyArray<GraphQLFormattedError>; data?: never }
);

export const mockOperation = <
  TData,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: TypedDocumentNode<TData, TVariables>,
  {
    variables,
    maxUsageCount,
    delay,
    ...result
  }: MockOperationOptions<TData, TVariables>
): MockLink.MockedResponse<TData, TVariables> => ({
  request: { query, variables },
  result: result.errors ? { errors: result.errors } : { data: result.data },
  maxUsageCount,
  ...(delay === undefined ? {} : { delay }),
});

export const anyVariables = () => true;

export const mockSettingListQuery = (settings: FullSettingFragment[] = []) =>
  mockOperation(SettingListDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', settings },
  });

export const mockChallengeQuery = (
  challenge: ChallengeQuery['challenge'] = mockChallenge()
) =>
  mockOperation(ChallengeDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', challenge },
  });

export const mockPrimaryBannerQuery = (
  primaryBanner: FullBannerFragment | null = null
) =>
  mockOperation(PrimaryBannerDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', primaryBanner },
  });

/** The banner and modal prompts a page asks for, by default none. */
export const mockEngagementPromptsQuery = (
  engagementPrompts: FullEngagementPromptFragment[] = []
) =>
  mockOperation(EngagementPromptsDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', engagementPrompts },
  });

export const mockPeerProfileQuery = (
  peerProfile: FullPeerProfileFragment = mockPeerProfile()
) =>
  mockOperation(PeerProfileDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', peerProfile },
  });

export const mockCheckLoginOtpQuery = (checkLoginOtp = false) =>
  mockOperation(CheckLoginOtpDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', checkLoginOtp },
  });

export const mockMutationResult = <TData>(
  overrides: Partial<
    Pick<useMutation.Result<TData>, 'data' | 'error' | 'loading' | 'called'>
  > = {}
): useMutation.Result<TData> => ({
  data: undefined,
  error: undefined,
  loading: false,
  called: false,
  client: new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.empty(),
  }),
  reset: () => undefined,
  ...overrides,
});
