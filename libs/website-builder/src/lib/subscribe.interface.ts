import {QueryResult} from '@apollo/client'
import {
  ChallengeQuery,
  MemberPlanListQuery,
  SubscribeMutationVariables
} from '@wepublish/website/api'

export type BuilderSubscribeProps = {
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>
  memberPlans: Pick<QueryResult<MemberPlanListQuery>, 'data' | 'loading' | 'error'>

  onSubmit: (
    data: Pick<
      SubscribeMutationVariables,
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
    >
  ) => void
}
