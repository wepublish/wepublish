import {migratePostById, migratePosts, migratePostsFromCategory} from './lib/posts'

async function migrate() {
  await migratePostById(200106, 203279, 202906, 201384, 202940, 202666)
  await migratePosts(30)
  await migratePostsFromCategory(4371, 20)
  await migratePostsFromCategory(4950, 20)
}

migrate().catch(error => console.error('Migration failed:', error))
