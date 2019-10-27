#!/usr/bin/env node
import {WepublishGraphQLSchema, contextFromRequest} from '@wepublish/api/server'
import {ArticleVersionState, BlockType, generateIDSync} from '@wepublish/api'
import {ApolloServer} from 'apollo-server'

import MockAdapter from '@wepublish/api-adapter-memory'

const adapter = new MockAdapter({users: [{id: '123', email: 'dev@wepublish.ch', password: '123'}]})

adapter.createArticle(generateIDSync(), {
  title: 'Test',
  lead:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  state: ArticleVersionState.Published,
  blocks: [{type: BlockType.Foo, foo: 'test'}, {type: BlockType.Bar, bar: 0}]
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
