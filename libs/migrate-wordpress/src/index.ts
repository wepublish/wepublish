import {migrate as migratePosts} from './migrate-posts'
import {migrate as migrateSubscriptions} from './migrate-subscriptions'

migrateSubscriptions().catch(error => console.error('Migration failed:', error))
// .then(() => migratePosts().catch(error => console.error('Migration failed:', error)))
