import {fetchPost, fetchPosts, WordpressPost} from './wordpress-api'
import {migratePost} from './post'
import {prepareArticleData, PreparedArticleData} from './prepare-data'
import {mapLimit} from 'async'

async function prepareDataAndMigratePost(post: WordpressPost) {
  console.log(`Migrating article ${post.slug}`)
  const data = await prepareArticleData(post)
  const {title, slug, link} = data
  console.log({title, slug, link})
  try {
    await migratePost(data)
  } catch (error) {
    console.error(error)
  }
}

async function migratePostFromData(data: PreparedArticleData) {
  const {title, slug, link} = data
  console.log(`Migrating article ${slug}`)
  console.log({title, slug, link})
  try {
    await migratePost(data)
  } catch (error) {
    console.error(error)
  }
}

export const migratePosts = async (limit?: number) => {
  console.log('Migrating general articles', {limit})
  let batchSize = process.env['BATCH_SIZE'] ?? 1
  let postsMigrated = 0
  for (let page = 1; ; page++) {
    if (limit) {
      batchSize = Math.min(limit - postsMigrated, +batchSize)
    }

    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts({
      page,
      perPage: +batchSize
    })
    if (batch.length === 0) break

    await mapLimit(batch, 5, async (post: WordpressPost) => {
      postsMigrated++
      console.warn(`General articles ${postsMigrated}/${limit ?? 'All'}`)
      await prepareDataAndMigratePost(post)
    })

    if (limit !== undefined && postsMigrated >= limit) {
      return
    }
  }
}

export const migratePostsFromCategory = async (categoryId: number, limit?: number) => {
  console.log('Migrating category articles', {categoryId, limit})
  let batchSize = process.env['BATCH_SIZE'] ?? 1
  let postsMigrated = 0
  for (let page = 1; ; page++) {
    if (limit) {
      batchSize = Math.min(limit - postsMigrated, +batchSize)
    }
    console.log(`Fetching page ${page}`)
    const batch = await fetchPosts({
      categoryId,
      page,
      perPage: +batchSize
    })
    if (batch.length === 0) break

    await mapLimit(batch, 5, async (post: WordpressPost) => {
      postsMigrated++
      console.warn(`Category ${categoryId} articles ${postsMigrated}/${limit ?? 'All'}`)
      await prepareDataAndMigratePost(post)
    })

    if (limit !== undefined && postsMigrated >= limit) {
      return
    }
  }
}

export const migratePostById = async (...ids: number[]) => {
  await mapLimit(ids, 5, async (id: number) => {
    console.log(`Loading post ${id}`)
    const post = await fetchPost(id)
    console.warn(`Migrating post id: ${id}`)
    return await prepareDataAndMigratePost(post)
  })
}
