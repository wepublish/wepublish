#!/usr/bin/env node
import {WepublishGraphQLSchema, contextFromRequest, generateIDSync} from '@wepublish/api'
import MockAdapter from '@wepublish/api-adapter-memory'

import {ApolloServer} from 'apollo-server'

async function asyncMain() {
  const adapter = new MockAdapter({
    users: [{id: generateIDSync(), email: 'dev@wepublish.ch', password: '123'}]
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const server = new ApolloServer({
    cors: {
      origin: '*',
      allowedHeaders: ['content-type', 'content-length', 'accept', 'origin', 'user-agent'],
      methods: ['POST', 'GET', 'OPTIONS']
    },
    schema: WepublishGraphQLSchema,
    tracing: true,

    context: ({req}) =>
      contextFromRequest(req, {
        adapter
      })
  })

  server.listen(port, address).then(({url}) => {
    console.log(`Server ready at ${url}`)
  })
}

asyncMain()
