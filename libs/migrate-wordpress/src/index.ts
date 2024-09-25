import {migrate as migratePosts} from './migrate-posts'
import {setupLogger} from './lib/logger'

setupLogger()

Promise.resolve().then(() =>
  migratePosts().catch(error => console.error('Articles migration failed:', error))
)
