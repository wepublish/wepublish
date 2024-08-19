import {createTag, getTagByName} from './private-api'
import {fetchCategoriesForPost, fetchTagsForPost, WordpressTag} from './wordpress-api'
import {decode} from 'html-entities'

const ensureTag = async ({name: tag}: WordpressTag): Promise<{id: string}> => {
  const existingTag = await getTagByName(tag)
  if (existingTag) {
    console.log('  tag exists', tag)
    return existingTag
  }
  console.log('  tag create', tag)
  return await createTag({tag})
}

export const ensureTagsForPost = async (postId: number) => {
  const categories = await fetchCategoriesForPost(postId)
  const tags = await fetchTagsForPost(postId.toString())
  const postTags = [...tags, ...categories].map(tag => ({...tag, name: decode(tag.name)}))

  const wepTagIds = []
  for (const tag of postTags) {
    wepTagIds.push((await ensureTag(tag)).id)
  }
  return wepTagIds
}
