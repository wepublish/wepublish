#!/usr/bin/env node
import {WepublishServer} from '@wepublish/api'

import {KarmaMediaAdapter} from '@wepublish/api-media-karma'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb'

import startMediaServer from '@karma.run/media'
import LocalStorageBackend from '@karma.run/media-storage-local'
import SharpImageBackend from '@karma.run/media-image-sharp'

import {URL} from 'url'
import {resolve as resolvePath} from 'path'

async function asyncMain() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : undefined
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const mediaStoragePath = process.env.MEDIA_STORAGE_PATH ?? resolvePath(__dirname, '../.media')
  const mediaServerToken = process.env.MEDIA_SERVER_TOKEN! || '123'
  const mediaServerPort = process.env.MEDIA_PORT ? parseInt(process.env.MEDIA_PORT) : 4001
  const mediaServerAddress = process.env.MEDIA_ADDRESS ?? 'localhost'

  const mediaServerURL = new URL(`http://${mediaServerAddress}:${mediaServerPort}`)
  const mediaAdapter = new KarmaMediaAdapter(mediaServerURL, mediaServerToken)

  await MongoDBAdapter.initialize({
    url: process.env.MONGO_URL!,
    database: 'test',
    locale: 'en',
    seed: async adapter => {
      adapter.createUser({email: 'dev@wepublish.ch', password: '123'})
    }
  })

  const dbAdapter = await MongoDBAdapter.connect({
    url: process.env.MONGO_URL!,
    database: 'test',
    locale: 'en'
  })

  const server = new WepublishServer({
    mediaAdapter,
    dbAdapter
  })

  await startMediaServer({
    storageBackend: new LocalStorageBackend(mediaStoragePath),
    imageBackend: new SharpImageBackend(),
    maxUploadSize: 1024 * 1024 * 10,
    port: mediaServerPort,
    address: mediaServerAddress,
    token: mediaServerToken
  })

  await server.listen(port, address)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
