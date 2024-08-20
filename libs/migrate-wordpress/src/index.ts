import {migratePostById, migratePosts, migratePostsFromCategory} from './lib/posts'

async function migrate() {
  await migratePostById(202666)
  return
  await migratePosts(30)
  await migratePostsFromCategory(4371, 20)
  await migratePostsFromCategory(4950, 20)
}

migrate().catch(error => console.error('Migration failed:', error))
