import {createTag, getTagByName, updateTag} from './private-api'
import {fetchCategoriesForPost, fetchTagsForPost} from './wordpress-api'
import {decode} from 'html-entities'

type Tag = {
  name: string
  main?: boolean
}

const ensureTag = async ({name, main = false}: Tag): Promise<{id: string}> => {
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

export const ensureTagsForPost = async (postId: number) => {
  const categories: Tag[] = (await fetchCategoriesForPost(postId)).map(({name, parent}) => ({
    name,
    main: !parent
  }))
  const tags: Tag[] = await fetchTagsForPost(postId.toString())
  const postTags: Tag[] = [...tags, ...categories].map(({name, ...tag}) => ({
    ...tag,
    name: decode(name)
  }))

  const wepTagIds = []
  for (const tag of postTags) {
    wepTagIds.push((await ensureTag(tag)).id)
  }
  return wepTagIds
}
