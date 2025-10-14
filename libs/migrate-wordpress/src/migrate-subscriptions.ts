import { createReadStream } from 'fs';
import { migrateSubscriptionsFromStream } from './lib/subscriptions';

export async function migrate() {
  await migrateSubscriptionsFromStream(
    createReadStream('Export_300919_v2.csv')
  );
}
