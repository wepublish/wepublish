import {
  ArticleInput,
  AuthorBySlug,
  AuthorBySlugQuery,
  AuthorInput,
  CreateArticle,
  CreateArticleMutation,
  CreateArticleMutationVariables,
  CreateAuthor,
  CreateAuthorMutation,
  CreateAuthorMutationVariables,
  DeleteArticle,
  DeleteArticleMutation,
  DeleteArticleMutationVariables,
  ImageList,
  ImageListQuery,
  PublishArticle,
  PublishArticleMutation,
  PublishArticleMutationVariables
} from '../api/private'
import {GraphQLClient} from 'graphql-request'

export const privateToken = 'DDqxIRefm7VxG3ue1czEPbnW66U6FcxJ'
export const privateGraphqlEndpoint = 'http://localhost:4000/v1/admin'
export const privateClient = new GraphQLClient(privateGraphqlEndpoint, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${privateToken}`
  }
})

export async function getAuthorBySlug(slug: string) {
  return (
    await privateClient.request<AuthorBySlugQuery>(AuthorBySlug, {
      slug
    })
  ).author
}

export async function createAuthor(input: AuthorInput) {
  return (
    await privateClient.request<CreateAuthorMutation, CreateAuthorMutationVariables>(CreateAuthor, {
      input
    })
  ).createAuthor!
}

export async function createArticle(input: ArticleInput) {
  return (
    await privateClient.request<CreateArticleMutation, CreateArticleMutationVariables>(
      CreateArticle,
      {
        input
      }
    )
  ).createArticle!
}

export async function deleteArticle(id: string) {
  return (
    await privateClient.request<DeleteArticleMutation, DeleteArticleMutationVariables>(
      DeleteArticle,
      {
        id
      }
    )
  ).deleteArticle
}

export async function publishArticle(id: string) {
  return await privateClient.request<PublishArticleMutation, PublishArticleMutationVariables>(
    PublishArticle,
    {
      id,
      publishAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  )
}

export async function getImagesByTitle(title: string) {
  return (
    await privateClient.request<ImageListQuery>(ImageList, {
      filter: title
    })
  ).images
}
