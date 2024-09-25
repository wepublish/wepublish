import {migrateAllPosts, migratePostById, migratePostsFromCategory} from './lib/posts'

export async function migrate() {
  await migrateAllPosts()
}
