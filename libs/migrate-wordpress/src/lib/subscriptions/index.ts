import {parse} from 'csv-parse'
import {ReadStream} from 'fs'
import {convertColumnsToRow} from './row'

import {migrateUser} from './user'
import {migrateSubscription} from './subscription'
import {streamLimit} from './streaml-limit'

export async function migrateSubscriptionsFromStream(stream: ReadStream) {
  return new Promise((resolve, reject) => {
    const parser = stream.pipe(parse({delimiter: ';', fromLine: 2}))
    parser
      .on('data', streamLimit<string[]>(parser, processRow, 5))
      .on('end', resolve)
      .on('error', reject)
  })
}

export async function processRow(columns: string[]) {
  const row = convertColumnsToRow(columns)
  const user = await migrateUser(row)
  if (!user) {
    throw new Error(`Could not find or create user "${row.email}"`)
  }
  await migrateSubscription(user, row)
}
