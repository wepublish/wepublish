import gql from 'graphql-tag'
import {useQuery, QueryHookOptions, useMutation, MutationHookOptions} from '@apollo/react-hooks'

import {ImageRefFragment, ImageRefData} from './image'
import {RichTextValue} from './blocks'

export const AuthorFragment = gql`
  fragment AuthorFragment on Author {
    id
    name
    slug
    image {
      ...ImageRefFragment
    }
    links {
      title
      url
    }
    bio
  }

  ${ImageRefFragment}
`

export interface AuthorLink {
  title: string
  url: string
}

export interface Author {
  id: string
  name: string
  slug: string
  image?: ImageRefData
  links?: AuthorLink[]
  bio?: RichTextValue
}

// Query
// =====

const ListAuthorsQuery = gql`
  query ListAuthors($filter: String, $after: ID, $before: ID, $first: Int, $last: Int) {
    authors(filter: {name: $filter}, after: $after, before: $before, first: $first, last: $last) {
      nodes {
        ...AuthorFragment
      }
    }
  }

  ${AuthorFragment}
`

export interface ListAuthorsData {
  authors: {
    nodes: Author[]
  }
}

export interface ListAuthorsVariables {
  filter?: string
  after?: string
  before?: string
  first?: number
  last?: number
}

export function useListAuthorsQuery(
  opts?: QueryHookOptions<ListAuthorsData, ListAuthorsVariables>
) {
  return useQuery<ListAuthorsData, ListAuthorsVariables>(ListAuthorsQuery, opts)
}

const AuthorQuery = gql`
  query Author($id: ID!) {
    author(id: $id) {
      ...AuthorFragment
    }
  }

  ${AuthorFragment}
`

export interface AuthorsData {
  author?: Author
}

export interface AuthorVariables {
  id: string
}

export function useAuthorQuery(opts?: QueryHookOptions<AuthorsData, AuthorVariables>) {
  return useQuery<AuthorsData, AuthorVariables>(AuthorQuery, opts)
}

// Mutation
// ========

export interface AuthorInput {
  name?: string
  slug: string
  imageID?: string
  links: AuthorLink[]
  bio: RichTextValue
}

const CreateAuthorMutation = gql`
  mutation CreateAuthor($input: AuthorInput!) {
    createAuthor(input: $input) {
      ...AuthorFragment
    }
  }

  ${AuthorFragment}
`

export interface CreateAuthorMutationData {
  createAuthor: Author
}

export interface CreateAuthorVariables {
  input: AuthorInput
}

export function useCreateAuthorMutation(
  opts?: MutationHookOptions<CreateAuthorMutationData, CreateAuthorVariables>
) {
  return useMutation<CreateAuthorMutationData, CreateAuthorVariables>(CreateAuthorMutation, opts)
}

const UpdateAuthorMutation = gql`
  mutation UpdateAuthor($id: ID!, $input: AuthorInput!) {
    updateAuthor(id: $id, input: $input) {
      ...AuthorFragment
    }
  }

  ${AuthorFragment}
`

export interface UpdateAuthorMutationData {
  updateAuthor: Author
}

export interface UpdateAuthorVariables {
  id: string
  input: AuthorInput
}

export function useUpdateAuthorMutation(
  opts?: MutationHookOptions<UpdateAuthorMutationData, UpdateAuthorVariables>
) {
  return useMutation<UpdateAuthorMutationData, UpdateAuthorVariables>(UpdateAuthorMutation, opts)
}

const DeleteAuthorMutation = gql`
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id)
  }
`

export interface DeleteAuthorMutationData {
  deleteAuthor?: boolean
}

export interface DeleteAuthorVariables {
  id: string
}

export function useDeleteAuthorMutation(
  opts?: MutationHookOptions<DeleteAuthorMutationData, DeleteAuthorVariables>
) {
  return useMutation<DeleteAuthorMutationData, DeleteAuthorVariables>(DeleteAuthorMutation, opts)
}
