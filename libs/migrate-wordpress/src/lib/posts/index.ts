import {fetchPost, fetchPosts, WordpressPost} from './wordpress-api'
import {migratePost} from './post'
import {prepareArticleData} from './prepare-data'
import {mapLimit} from 'async'
import chalk from 'chalk'
import {logError} from './error-logger'
import {createTimer, humanizeObject} from './utils'
import {fixedMessage} from '../logger'

async function prepareDataAndMigratePost(post: WordpressPost) {
  console.debug(`Migrating article ${post.slug}`)
  const data = await prepareArticleData(post)
  const {title, slug, link} = data
  console.debug({title, slug, link})
  try {
    return await migratePost(data)
  } catch (error: any) {
    console.error(chalk.bgRed.black(`Article postId: ${post.id} FAILED`))
    await logError(`article-${post.id}`, `Article postId: ${post.id} FAILED`)
    await logError(`article-${post.id}`, post.link)
    await logError(`article-${post.id}`, error.stack ?? error.message)
    return
  }
}

export const migrateAllPosts = async (limit?: number) => {
  console.log(`Migrating general articles (${humanizeObject({limit})})`)
  await migratePosts(limit)
}

export const migratePostsFromCategory = async (categoryId: number, limit?: number) => {
  console.log(`Migrating category articles (${humanizeObject({categoryId, limit})})`)
  await migratePosts(limit, {categoryId})
}

export const migratePosts = async (limit?: number, query?: Record<string, string | number>) => {
  const timer = createTimer()
  fixedMessage('Running')
  timer.onUpdate(() => {
    fixedMessage(timer.message())
  })
  let batchSize = process.env['BATCH_SIZE'] ?? 1
  let postsMigrating = 0
  let postsMigrated = 0
  let totalCount: number
  for (let page = 1; ; page++) {
    if (limit) {
      batchSize = Math.min(limit - postsMigrated, +batchSize)
    }

    console.debug(`Fetching page ${page}`)
    const {items: batch, total} = await fetchPosts({
      ...query,
      page,
      perPage: +batchSize
    })
    totalCount = limit ? Math.min(+total, limit) : +total
    timer.updateTotal(totalCount)

    if (batch.length === 0) break

    await mapLimit(batch, 5, async (post: WordpressPost) => {
      postsMigrating++
      const result = await prepareDataAndMigratePost(post)
      if (result) {
        console.log(
          `Migrated post id: ${chalk.bgYellow(
            post.id
          )} (${++postsMigrated}/${totalCount}) ${chalk.bgGreen('DONE')}`
        )
      } else {
        postsMigrated++
      }
      timer.updateDone(postsMigrated)
    })

    if (limit !== undefined && postsMigrated >= limit) {
      return
    }
  }
}

export const migratePostById = async (...ids: number[]) => {
  console.log(`Migrating ${ids.length} articles by id`)
  await mapLimit(ids, 5, async (id: number) => {
    console.debug(`Loading post ${id}`)
    const post = await fetchPost(id)
    console.debug(`Migrating post id: ${id}`)
    const result = await prepareDataAndMigratePost(post)
    if (result) {
      console.log(
        `Migrated article id: ${chalk.bgYellow(id)} (${ids.indexOf(id) + 1}/${
          ids.length
        }) ${chalk.bgGreen('DONE')}`
      )
    }
  })
}
