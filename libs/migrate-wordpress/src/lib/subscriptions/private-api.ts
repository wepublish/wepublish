import {
  CreateUser,
  CreateUserMutation,
  CreateUserMutationVariables,
  UserInput,
  CreateSubscription,
  CreateSubscriptionMutation,
  CreateSubscriptionMutationVariables,
  SubscriptionInput,
  UserList,
  UserListQuery,
  UserListQueryVariables,
  DeleteUserMutation,
  DeleteUserMutationVariables,
  DeleteUser,
  DeleteSubscription,
  DeleteSubscriptionMutation,
  DeleteSubscriptionMutationVariables,
  MemberPlanListQuery,
  MemberPlanListQueryVariables,
  MemberPlanList
} from '../../api/private'
import {privateClient} from '../api/clients'
import {Row} from './row'

export async function createUser({
  password,
  ...input
}: UserInput & {password: string}): Promise<CreateUserMutation['createUser']> {
  return (
    await privateClient.request<CreateUserMutation, CreateUserMutationVariables>(CreateUser, {
      input,
      password
    })
  ).createUser!
}

export async function findUserByEmail(
  email: string
): Promise<UserListQuery['users']['nodes'][number] | null> {
  return (
    await privateClient.request<UserListQuery, UserListQueryVariables>(UserList, {
      filter: email
    })
  ).users.nodes[0]
}

export async function deleteUser(userId: string) {
  return (
    await privateClient.request<DeleteUserMutation, DeleteUserMutationVariables>(DeleteUser, {
      id: userId
    })
  ).deleteUser
}

export async function createSubscription(input: SubscriptionInput) {
  return (
    await privateClient.request<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>(
      CreateSubscription,
      {
        input
      }
    )
  ).createSubscription!
}

export async function deleteSubscription(id: string) {
  return (
    await privateClient.request<DeleteSubscriptionMutation, DeleteSubscriptionMutationVariables>(
      DeleteSubscription,
      {
        id
      }
    )
  ).deleteSubscription!
}

export async function findMemberPlanByName(name: string) {
  return (
    await privateClient.request<MemberPlanListQuery, MemberPlanListQueryVariables>(MemberPlanList, {
      filter: name
    })
  ).memberPlans.nodes.find(mp => mp.name === name)
}

export async function getMemberPlans() {
  return (
    await privateClient.request<MemberPlanListQuery, MemberPlanListQueryVariables>(
      MemberPlanList,
      {}
    )
  ).memberPlans.nodes
}
