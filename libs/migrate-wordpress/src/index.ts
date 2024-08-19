import {migratePosts} from './lib/posts'

migratePosts().catch(error => console.error('Migration failed:', error))
