import {parse} from 'csv-parse'
import {ReadStream} from 'fs'
import {convertColumnsToRow} from './row'

import {migrateUser} from './user'
import {migrateSubscription} from './subscription'

function oneAtOnce(stream: ReadStream, processor: (data: string[]) => Promise<void>) {
  return async function (data: string[]) {
    stream.pause()
    try {
      await processor(data)
    } catch (error) {
      console.error('Error processing data:', error)
    } finally {
      stream.resume()
    }
    return
  }
}

export async function migrateSubscriptionsFromStream(stream: ReadStream) {
  return new Promise((resolve, reject) => {
    stream
      .pipe(parse({delimiter: ';', fromLine: 2}))
      .on('data', oneAtOnce(stream, processRow))
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
