import {migrate as migratePosts} from './migrate-posts'
import {migrate as migrateSubscriptions} from './migrate-subscriptions'

Promise.resolve()
  .then(() =>
    migrateSubscriptions().catch(error => console.error('Subscriptions migration failed:', error))
  )
  .then(() => migratePosts().catch(error => console.error('Articles migration failed:', error)))
