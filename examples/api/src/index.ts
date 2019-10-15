#!/usr/bin/env node
import {createServer} from 'http'
import {createAPIHandler} from '@wepublish/api/server'
import {ArticleVersionState, BlockType, generateIDSync} from '@wepublish/api/shared'
import MockAdapter from '@wepublish/api-adapter-memory'

const adapter = new MockAdapter()

adapter.createArticle(generateIDSync(), {
  title: 'Test',
  lead:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  state: ArticleVersionState.Published,
  blocks: [{type: BlockType.Foo, foo: 'test'}, {type: BlockType.Bar, bar: 0}]
})

if (!process.env.TOKEN_SECRET) {
  throw new Error('No TOKEN_SECRET provided in the environment!')
}

const server = createServer(
  createAPIHandler({
    peerFetchTimeout: 200,
    adapter,
    tokenSecret: process.env.TOKEN_SECRET
  })
)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

server.listen(port, address)
console.log(`API server listening on: http://${address}:${port}`)
