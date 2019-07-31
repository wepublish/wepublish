#!/usr/bin/env node
import {createServer} from 'http'
import {createAPIHandler} from '@wepublish/api/server'
import MockAdapter from '@wepublish/api-adapter-mock'
import {generateID, ArticleVersionState} from '@wepublish/api/shared'

const adapter = new MockAdapter()

adapter.createArticle(generateID(), {
  article: {
    title: 'Test',
    lead:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    state: ArticleVersionState.Published
  }
})

const server = createServer(
  createAPIHandler({
    peerFetchTimeout: 200,
    adapter
  })
)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

server.listen(port, address)
console.log(`API server listening on: http://${address}:${port}`)
