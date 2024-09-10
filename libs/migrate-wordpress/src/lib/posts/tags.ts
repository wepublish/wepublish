import {fetchCategoriesForPost, fetchTagsForPost} from './wordpress-api'
import {decode} from 'html-entities'
import {privateClient} from '../api/clients'
import {
  CreateTag,
  CreateTagMutation,
  CreateTagMutationVariables,
  TagList,
  TagListQuery,
  TagListQueryVariables,
  TagType,
  UpdateTag,
  UpdateTagMutation,
  UpdateTagMutationVariables
} from '../../api/private'

export type Tag = {
  id: string
}

type TagInput = {
  name: string
  main?: boolean
}

const ensureTag = async ({name, main = false}: TagInput): Promise<Tag> => {
  const tag = name
  const existingTag = await getTagByName(tag)
  if (existingTag) {
    console.log('  tag exists', tag)
    if (existingTag.main != main) {
      console.log('  tag update', tag)
      await updateTag({id: existingTag.id, main})
    }
    return existingTag
  }
  console.log('  tag create', tag)
  return await createTag({tag, main})
}

export const ensureTagsForPost = async (postId: number): Promise<Tag[]> => {
  const categories: TagInput[] = (await fetchCategoriesForPost(postId)).map(({name, parent}) => ({
    name,
    main: !parent
  }))
  const tags: TagInput[] = await fetchTagsForPost(postId.toString())
  const postTags: TagInput[] = [...tags, ...categories].map(({name, ...tag}) => ({
    ...tag,
    name: decode(name)
  }))

  const wepTagIds = []
  for (const tag of postTags) {
    wepTagIds.push(await ensureTag(tag))
  }
  return wepTagIds
}

// API

export async function getTagByName(name: string) {
  return (
    await privateClient.request<TagListQuery, TagListQueryVariables>(TagList, {
      filter: {
        tag: name
      }
    })
  ).tags?.nodes.find(({tag}) => tag === name)
}

export async function createTag(variables: Omit<CreateTagMutationVariables, 'type'>) {
  return (
    await privateClient.request<CreateTagMutation, CreateTagMutationVariables>(CreateTag, {
      ...variables,
      type: TagType.Article
    })
  ).createTag!
}

export async function updateTag(variables: UpdateTagMutationVariables) {
  return (
    await privateClient.request<UpdateTagMutation, UpdateTagMutationVariables>(UpdateTag, variables)
  ).updateTag!
}
