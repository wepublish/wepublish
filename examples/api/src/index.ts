#!/usr/bin/env node
import {contextFromRequest, generateIDSync, GraphQLWepublishSchema} from '@wepublish/api'

import {MemoryStorageAdapter} from '@wepublish/api-storage-memory'
import {KarmaMediaAdapter} from '@wepublish/api-media-karma'

import {ApolloServer} from 'apollo-server'
import {URL} from 'url'

async function asyncMain() {
  if (!process.env.MEDIA_SERVER_URL) {
    throw new Error('No MEDIA_SERVER_URL defined in environment.')
  }

  if (!process.env.MEDIA_SERVER_TOKEN) {
    throw new Error('No MEDIA_SERVER_TOKEN defined in environment.')
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const mediaServerURL = new URL(process.env.MEDIA_SERVER_URL)
  const mediaServerToken = process.env.MEDIA_SERVER_TOKEN

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
    tracing: true,

    context: ({req}) =>
      contextFromRequest(req, {
        storageAdapter,
        mediaAdapter
      })
  })

  server.listen(port, address).then(({url}) => {
    console.log(`Server ready at ${url}`)
  })
}

asyncMain()
