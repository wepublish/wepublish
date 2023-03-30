import {QueryResult, MutationResult} from '@apollo/client'
import {
  ChallengeQuery,
  MemberPlanListQuery,
  SubscribeMutation,
  SubscribeMutationVariables
} from '@wepublish/website/api'

export type BuilderSubscribeProps = {
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>
  memberPlans: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error'>
  subscribe: Pick<MutationResult<SubscribeMutation>, 'data' | 'loading' | 'error'>

  onSubmit: (
    data: Pick<
      SubscribeMutationVariables,
      | 'successURL'
      | 'failureURL'
      | 'name'
      | 'firstName'
      | 'preferredName'
      | 'email'
      | 'password'
      | 'monthlyAmount'
      | 'challengeAnswer'
      | 'paymentPeriodicity'
      | 'memberPlanID'
      | 'paymentMethodID'
      | 'address'
      | 'autoRenew'
    >
  ) => void

  className?: string
}
