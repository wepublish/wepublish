import gql from 'graphql-tag'
import {QueryHookOptions, useQuery, useMutation, MutationHookOptions} from '@apollo/react-hooks'

export interface Token {
  id: string
  name: string
}

// Query
// =====
export const TokenListQueryName = 'TokenList'

export const TokenListQuery = gql`
  query ${TokenListQueryName} {
    tokens {
      id
      name
    }
  }
`

export interface TokenListData {
  tokens: Token[]
}

export function useTokenListQuery(opts?: QueryHookOptions<TokenListData>) {
  return useQuery<TokenListData>(TokenListQuery, opts)
}

// Mutation
// ========

export interface TokenInput {
  name: string
}

export const CreateTokenMutation = gql`
  mutation CreateToken($input: TokenInput!) {
    createToken(input: $input) {
      id
      name
    }
  }
`

export interface CreateTokenData {
  createToken: Token
}

export interface CreateTokenVariables {
  input: TokenInput
}

export function useCreateTokenMutation(
  opts?: MutationHookOptions<CreateTokenData, CreateTokenVariables>
) {
  return useMutation(CreateTokenMutation, opts)
}

export const DeleteTokenMutation = gql`
  mutation DeleteToken($id: ID!) {
    deleteToken(id: $id)
  }
`

export interface DeleteTokenData {
  deleteToken: string
}

export interface DeleteTokenVariables {
  id: string
}

export function useDeleteTokenMutation(
  opts?: MutationHookOptions<DeleteTokenData, DeleteTokenVariables>
) {
  return useMutation(DeleteTokenMutation, opts)
}
