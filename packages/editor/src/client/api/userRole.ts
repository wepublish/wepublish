import gql from 'graphql-tag'
import {useQuery, QueryHookOptions, useMutation, MutationHookOptions} from '@apollo/react-hooks'

export const UserRoleFragment = gql`
  fragment UserRoleFragment on UserRole {
    id
    name
    description
    systemRole
    permissions {
      id
      description
      checked
      deprecated
    }
  }
`

export interface Permission {
  id: string
  description: string
  checked: boolean
  deprecated: boolean
}

export interface UserRole {
  id: string
  name: string
  description: string
  systemRole: boolean
  permissions: Permission[]
}

// Query
// =====

const ListUserRolesQuery = gql`
  query ListUserRoles($filter: String, $after: ID, $before: ID, $first: Int, $last: Int) {
    userRoles(filter: {name: $filter}, after: $after, before: $before, first: $first, last: $last) {
      nodes {
        ...UserRoleFragment
      }
    }
  }

  ${UserRoleFragment}
`

export interface ListUserRolesData {
  userRoles: {
    nodes: UserRole[]
  }
}

export interface ListUserRolesVariables {
  filter?: string
  after?: string
  before?: string
  first?: number
  last?: number
}

export function useListUserRolesQuery(
  opts?: QueryHookOptions<ListUserRolesData, ListUserRolesVariables>
) {
  return useQuery<ListUserRolesData, ListUserRolesVariables>(ListUserRolesQuery, opts)
}

const UserRoleQuery = gql`
  query UserRole($id: ID!) {
    userRole(id: $id) {
      ...UserRoleFragment
    }
  }

  ${UserRoleFragment}
`

export interface UserRoleData {
  userRole?: UserRole
}

export interface UserRoleVariables {
  id: string
}

export function useUserRoleQuery(opts?: QueryHookOptions<UserRoleData, UserRoleVariables>) {
  return useQuery<UserRoleData, UserRoleVariables>(UserRoleQuery, opts)
}

// Mutation
// ========

export interface UserRoleInput {
  name: string
  description: string
  permissions: string[]
}

const CreateUserRoleMutation = gql`
  mutation CreateUserRole($input: UserRoleInput!) {
    createUserRole(input: $input) {
      ...UserRoleFragment
    }
  }

  ${UserRoleFragment}
`

export interface CreateUserRoleMutationData {
  createUserRole: UserRole
}

export interface CreateUserRoleVariables {
  input: UserRoleInput
}

export function useCreateUserRoleMutation(
  opts?: MutationHookOptions<CreateUserRoleMutationData, CreateUserRoleVariables>
) {
  return useMutation<CreateUserRoleMutationData, CreateUserRoleVariables>(
    CreateUserRoleMutation,
    opts
  )
}

const UpdateUserRoleMutation = gql`
  mutation UpdateUserRole($id: ID!, $input: UserRoleInput!) {
    updateUserRole(id: $id, input: $input) {
      ...UserRoleFragment
    }
  }

  ${UserRoleFragment}
`

export interface UpdateUserRoleMutationData {
  updateUserRole: UserRole
}

export interface UpdateUserRoleVariables {
  id: string
  input: UserRoleInput
}

export function useUpdateUserRoleMutation(
  opts?: MutationHookOptions<UpdateUserRoleMutationData, UpdateUserRoleVariables>
) {
  return useMutation<UpdateUserRoleMutationData, UpdateUserRoleVariables>(
    UpdateUserRoleMutation,
    opts
  )
}

const DeleteUserRoleMutation = gql`
  mutation DeleteUserRole($id: ID!) {
    deleteUserRole(id: $id)
  }
`

export interface DeleteUserRoleMutationData {
  deleteUser?: boolean
}

export interface DeleteUserRoleVariables {
  id: string
}

export function useDeleteUserRoleMutation(
  opts?: MutationHookOptions<DeleteUserRoleMutationData, DeleteUserRoleVariables>
) {
  return useMutation<DeleteUserRoleMutationData, DeleteUserRoleVariables>(
    DeleteUserRoleMutation,
    opts
  )
}
