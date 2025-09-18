import { migrateAllPosts } from './lib/posts';

export async function migrate() {
  await migrateAllPosts();
}
