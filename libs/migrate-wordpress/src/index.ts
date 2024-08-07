import {migratePosts} from './lib/migrate'

migratePosts().catch(error => console.error('Migration failed:', error))
