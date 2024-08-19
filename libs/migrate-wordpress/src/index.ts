import {migratePosts, migratePostsFromCategory} from './lib/posts'

async function migrate() {
  await migratePosts(30)
  await migratePostsFromCategory(4371, 20)
  await migratePostsFromCategory(4950, 20)
}

migrate().catch(error => console.error('Migration failed:', error))
