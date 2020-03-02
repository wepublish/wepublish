#!/usr/bin/env node
import {contextFromRequest, generateIDSync, GraphQLWepublishSchema} from '@wepublish/api'
import {MemoryStorageAdapter} from '@wepublish/api-storage-memory'

import {KarmaMediaAdapter} from '@wepublish/api-media-karma'
import {KarmaStorageAdapter} from '@wepublish/api-storage-karma'

import startMediaServer from '@karma.run/media'
import LocalStorageBackend from '@karma.run/media-storage-local'
import SharpImageBackend from '@karma.run/media-image-sharp'

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import auth from './auth'

import {ApolloServer, CorsOptions} from 'apollo-server-express'
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

  const karmaURL = process.env.KARMA_URL
  const karmaUser = process.env.KARMA_USER
  const karmaPassword = process.env.KARMA_PASSWORD
  const shouldUseKarmaAdapter = karmaURL && karmaUser && karmaPassword

  const storageAdapter = shouldUseKarmaAdapter
    ? new KarmaStorageAdapter({
        url: karmaURL!,
        user: karmaUser!,
        password: karmaPassword!
      })
    : new MemoryStorageAdapter({
        users: [
          {id: generateIDSync(), email: 'dev@wepublish.ch', password: '123'},
          {id: generateIDSync(), email: 'nico.roos@tsri.ch', password: ''}
        ]
      })

  if (storageAdapter instanceof KarmaStorageAdapter) {
    if (await storageAdapter.initialize()) {
      await storageAdapter.createUser(generateIDSync(), 'dev@wepublish.ch', '123')
    }
  }

  const server = new ApolloServer({
    schema: GraphQLWepublishSchema,
    playground: true,
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
    maxUploadSize: 1024 * 1024 * 10,
    port: mediaServerPort,
    address: mediaServerAddress,
    token: mediaServerToken
  })

  const app = express()
  app.get('/hello', (req, res) => res.send('Hello World!'))
  const corsOptions: CorsOptions = {
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
  }
  app.use(cors(corsOptions))
  app.use(bodyParser.urlencoded({extended: true}))
  app.use('/auth', auth(storageAdapter))

  server.applyMiddleware({app})

  app.listen(port, address, () =>
    console.log(`API ready at http://${address}:${port}${server.graphqlPath}`)
  )
}

asyncMain()
