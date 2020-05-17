import gql from 'graphql-tag'
import {useQuery, QueryHookOptions, useMutation, MutationHookOptions} from '@apollo/react-hooks'

export const UserFragment = gql`
  fragment UserFragment on User {
    id
    name
    email
    roles {
      id
      name
      description
      systemRole
    }
  }
`

export interface UserRole {
  id: string
  name: string
  description: string
  systemRole: boolean
}

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
}

// Query
// =====

const ListUsersQuery = gql`
  query ListUsers($filter: String, $after: ID, $before: ID, $first: Int, $last: Int) {
    users(filter: {name: $filter}, after: $after, before: $before, first: $first, last: $last) {
      nodes {
        ...UserFragment
      }
    }
  }

  ${UserFragment}
`

export interface ListUsersData {
  users: {
    nodes: User[]
  }
}

export interface ListUsersVariables {
  filter?: string
  after?: string
  before?: string
  first?: number
  last?: number
}

export function useListUsersQuery(opts?: QueryHookOptions<ListUsersData, ListUsersVariables>) {
  return useQuery<ListUsersData, ListUsersVariables>(ListUsersQuery, opts)
}

const UserQuery = gql`
  query User($id: ID!) {
    user(id: $id) {
      ...UserFragment
    }
  }

  ${UserFragment}
`

export interface UsersData {
  user?: User
}

export interface UserVariables {
  id: string
}

export function useUserQuery(opts?: QueryHookOptions<UsersData, UserVariables>) {
  return useQuery<UsersData, UserVariables>(UserQuery, opts)
}

// Mutation
// ========

export interface UserInput {
  name: string
  email: string
  password: string
  roles: UserRole[]
}

const CreateUserMutation = gql`
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) {
      ...UserFragment
    }
  }

  ${UserFragment}
`

export interface CreateUserMutationData {
  createUser: User
}

export interface CreateUserVariables {
  input: UserInput
}

export function useCreateUserMutation(
  opts?: MutationHookOptions<CreateUserMutationData, CreateUserVariables>
) {
  return useMutation<CreateUserMutationData, CreateUserVariables>(CreateUserMutation, opts)
}

const UpdateUserMutation = gql`
  mutation UpdateUser($id: ID!, $input: UserInput!) {
    updateUser(id: $id, input: $input) {
      ...UserFragment
    }
  }

  ${UserFragment}
`

export interface UpdateUserMutationData {
  updateUser: User
}

export interface UpdateUserVariables {
  id: string
  input: UserInput
}

export function useUpdateUserMutation(
  opts?: MutationHookOptions<UpdateUserMutationData, UpdateUserVariables>
) {
  return useMutation<UpdateUserMutationData, UpdateUserVariables>(UpdateUserMutation, opts)
}

const DeleteUserMutation = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`

export interface DeleteUserMutationData {
  deleteUser?: boolean
}

export interface DeleteUserVariables {
  id: string
}

export function useDeleteUserMutation(
  opts?: MutationHookOptions<DeleteUserMutationData, DeleteUserVariables>
) {
  return useMutation<DeleteUserMutationData, DeleteUserVariables>(DeleteUserMutation, opts)
}
