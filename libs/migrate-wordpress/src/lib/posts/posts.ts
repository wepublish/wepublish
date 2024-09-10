import {fetchPost, fetchPosts, WordpressPost} from './wordpress-api'
import {migratePost} from './post'
import {prepareArticleData} from './prepare-data'

async function prepareDataAndMigratePost(post: WordpressPost) {
  const data = prepareArticleData(post)
  return await migratePost(data)
}

export const migratePosts = async (limit?: number) => {
  console.log('Migrating general articles', {limit})
  const BATCH_SIZE = process.env['BATCH_SIZE'] ?? 1
  let postsMigrated = 0
  for (let page = 1; ; page++) {
    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts({
      page,
      perPage: +BATCH_SIZE
    })
    if (batch.length === 0) {
      break
    }

    for (const post of batch) {
      if (limit !== undefined && postsMigrated >= limit) {
        return
      }
      await prepareDataAndMigratePost(post)
      postsMigrated++
    }
  }
}

export const migratePostsFromCategory = async (categoryId: number, limit?: number) => {
  console.log('Migrating category articles', {categoryId, limit})
  const BATCH_SIZE = process.env['BATCH_SIZE'] ?? 1
  let postsMigrated = 0
  for (let page = 1; ; page++) {
    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts({
      categoryId,
      page,
      perPage: +BATCH_SIZE
    })
    if (batch.length === 0) break

    for (const post of batch) {
      if (limit !== undefined && postsMigrated >= limit) {
        return
      }
      await prepareDataAndMigratePost(post)
      postsMigrated++
    }
  }
}
export const migratePostById = async (...ids: number[]) => {
  for (const id of ids) {
    const post = await fetchPost(id)
    await prepareDataAndMigratePost(post)
  }
}
