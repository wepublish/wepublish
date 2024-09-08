import {migratePostById, migratePosts, migratePostsFromCategory} from './lib/posts'

export async function migrate() {
  await migratePostById(203921) // hr surrounded links
  return
  await migratePostById(100273) // image gallery
  await migratePostById(182908) // article references
  await migratePostById(189813) // formatting
  await migratePostById(203921) // spacing before links
  await migratePostById(167171) // content-box + iframe
  await migratePostById(202384) // instagram aspect-ratio
  await migratePostById(
    197451,
    182908,
    190356,
    189813,
    203334,
    200106,
    203279,
    202906,
    201384,
    202940,
    202666
  )
  await migratePosts(30)
  await migratePostsFromCategory(4371, 20)
  await migratePostsFromCategory(4950, 20)
}
