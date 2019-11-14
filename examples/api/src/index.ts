#!/usr/bin/env node
import {contextFromRequest, generateIDSync, GraphQLWepublishSchema} from '@wepublish/api'
import {MemoryStorageAdapter} from '@wepublish/api-storage-memory'
import {KarmaMediaAdapter} from '@wepublish/api-media-karma'

import startMediaServer from '@karma.run/media'
import LocalStorageBackend from '@karma.run/media-storage-local'
import SharpImageBackend from '@karma.run/media-image-sharp'

import {ApolloServer} from 'apollo-server'
import {URL} from 'url'
import {resolve as resolvePath} from 'path'

async function asyncMain() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const mediaStoragePath = process.env.MEDIA_STORAGE_PATH ?? resolvePath(__dirname, '../.media')
  const mediaServerToken = process.env.MEDIA_SERVER_TOKEN! || '123'
  const mediaServerPort = process.env.MEDIA_PORT ? parseInt(process.env.MEDIA_PORT) : 3005
  const mediaServerAddress = process.env.MEDIA_ADDRESS ?? 'localhost'

  const mediaServerURL = new URL(`http://${mediaServerAddress}:${mediaServerPort}`)
  const mediaAdapter = new KarmaMediaAdapter(mediaServerURL, mediaServerToken)

  const storageAdapter = new MemoryStorageAdapter({
    users: [{id: generateIDSync(), email: 'dev@wepublish.ch', password: '123'}]
  })

  const server = new ApolloServer({
    cors: {
      origin: '*',
      allowedHeaders: [
        'authorization',
        'content-type',
        'content-length',
        'accept',
        'origin',
        'user-agent'
      ],
      methods: ['POST', 'GET', 'OPTIONS']
    },

    schema: GraphQLWepublishSchema,
    introspection: true,
    tracing: true,

    context: ({req}) =>
      contextFromRequest(req, {
        storageAdapter,
        mediaAdapter
      })
  })

  await startMediaServer({
    storageBackend: new LocalStorageBackend(mediaStoragePath),
    imageBackend: new SharpImageBackend(),
    port: mediaServerPort,
    address: mediaServerAddress,
    token: mediaServerToken
  })

  const {url} = await server.listen(port, address)
  console.log(`API server listening: ${url}`)
}

asyncMain()
