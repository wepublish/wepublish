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
import {PreparedArticleData} from './prepare-data'

export type Tag = {
  id: string
}

type TagInput = {
  name: string
  main?: boolean
}

const ensureTag = async ({name, main = false}: TagInput): Promise<Tag | undefined> => {
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
  return createTag({tag, main}).catch(e => {
    console.error(e)
    return undefined
  })
}

export async function ensureTags({tags}: PreparedArticleData): Promise<Tag[]> {
  return (await Promise.all(tags.map(t => ensureTag(t)))).filter(t => t) as Tag[]
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
