import {migrate} from './migrate-posts'

migrate().catch(error => console.error('Migration failed:', error))
