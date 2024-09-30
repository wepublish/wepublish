import {createReadStream} from 'fs'
import {migrateSubscriptionsFromStream} from './lib/subscriptions'

export async function migrate() {
  await migrateSubscriptionsFromStream(
    createReadStream(
      '/Users/tomasz/projects/wepublish/wepublish/libs/migrate-wordpress/subscriptions-export.csv'
    )
  )
}
