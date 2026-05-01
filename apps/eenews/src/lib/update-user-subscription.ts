import { gql, useMutation } from '@apollo/client';
import {
  FullSubscriptionFragment,
  FullSubscriptionFragmentDoc,
  PaymentPeriodicity,
} from '@wepublish/website/api';

// `updateUserSubscription` is on the website schema (subscription.resolver.ts)
// but the codegen doesn't emit a hook for it (only the admin
// `updateSubscription` is exposed elsewhere). Define the document inline so
// any user can flip their own autoRenew / payment method.
export const UpdateUserSubscriptionDocument = gql`
  mutation UpdateUserSubscription(
    $id: String!
    $input: UpdateUserSubscriptionInput!
  ) {
    updateUserSubscription(id: $id, input: $input) {
      ...FullSubscription
    }
  }
  ${FullSubscriptionFragmentDoc}
`;

export type UpdateUserSubscriptionMutationVariables = {
  id: string;
  input: {
    id: string;
    autoRenew: boolean;
    monthlyAmount: number;
    paymentMethodID: string;
    paymentPeriodicity: PaymentPeriodicity;
    memberPlanID: string;
  };
};

export type UpdateUserSubscriptionMutation = {
  __typename?: 'Mutation';
  updateUserSubscription: FullSubscriptionFragment | null;
};

export const useUpdateUserSubscriptionMutation = () =>
  useMutation<
    UpdateUserSubscriptionMutation,
    UpdateUserSubscriptionMutationVariables
  >(UpdateUserSubscriptionDocument);
