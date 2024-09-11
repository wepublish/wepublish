import {migratePostById, migratePosts, migratePostsFromCategory} from './lib/posts'

export async function migrate() {
  await migratePostById(
    203921, // hr surrounded links
    100273, // image gallery
    182908, // article references
    189813, // formatting
    203921, // spacing before links
    167171, // content-box + iframe
    202384, // instagram aspect-ratio
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
  await migratePosts(200)
  await migratePostsFromCategory(4371, 50)
  await migratePostsFromCategory(4950, 50)
}
