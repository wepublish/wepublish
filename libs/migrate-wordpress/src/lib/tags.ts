import {createTag, getTagByName} from './private-api'
import {fetchTagsForPost, WordpressTag} from './wordpress-api'

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
  const batch = await fetchTagsForPost(postId.toString())
  const wepTagIds = []
  for (const post of batch) {
    wepTagIds.push((await ensureTag(post)).id)
  }
  return wepTagIds
}
