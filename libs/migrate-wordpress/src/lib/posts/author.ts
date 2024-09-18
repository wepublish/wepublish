import {WordpressAuthor} from './wordpress-api'
import {ensureImage} from './image'
import {privateClient} from '../api/clients'
import {
  AuthorBySlug,
  AuthorBySlugQuery,
  AuthorInput,
  CreateAuthor,
  CreateAuthorMutation,
  CreateAuthorMutationVariables
} from '../../api/private'

export type Author = {id: string}

export const ensureAuthor = async (author: WordpressAuthor): Promise<Author> => {
  const {slug, link, url, name, description, avatar_urls} = author

  const existingAuthor = await getAuthorBySlug(author.slug)
  if (existingAuthor) {
    console.debug('  author exists', slug)
    return existingAuthor
  }

  const image = await ensureImage({
    url: avatar_urls['96'],
    title: name
  })

  console.debug('  author create', slug)
  return await createAuthor({
    name,
    slug,
    links: [{title: 'Link', url: link}],
    imageID: image.id
  })
}

// API

async function getAuthorBySlug(slug: string) {
  return (
    await privateClient.request<AuthorBySlugQuery>(AuthorBySlug, {
      slug
    })
  ).author
}

async function createAuthor(input: AuthorInput) {
  return (
    await privateClient.request<CreateAuthorMutation, CreateAuthorMutationVariables>(CreateAuthor, {
      input
    })
  ).createAuthor!
}
