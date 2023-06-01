import {QueryResult, MutationResult} from '@apollo/client'
import {
  ChallengeQuery,
  MemberPlanListQuery,
  SubscribeMutation,
  SubscribeMutationVariables,
  RegisterMutationVariables,
  RegisterMutation
} from '@wepublish/website/api'

export type BuilderSubscribeProps = {
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>
  memberPlans: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error'>
  subscribe: Pick<MutationResult<SubscribeMutation>, 'data' | 'loading' | 'error'>
  register: Pick<MutationResult<RegisterMutation>, 'data' | 'loading' | 'error'>
  className?: string
  onSubscribeWithRegister?: (data: {
    subscribe: SubscribeMutationVariables
    register: RegisterMutationVariables
  }) => void
  onSubscribe?: (data: SubscribeMutationVariables) => void
}
