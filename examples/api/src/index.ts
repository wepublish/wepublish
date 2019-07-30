#!/usr/bin/env node
import {createServer} from 'http'
import {createAPIHandler} from '@wepublish/api/server'
import {Article, Peer} from '@wepublish/api/shared'

import MockAdapter from '@wepublish/api-adapter-mock'

// const mockArticles: Article[] = [
//   {
//     id: 'a',
//     title: 'Article A',
//     lead:
//       'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper hendrerit tortor non feugiat.',
//     publishedDate: new Date('2019-02-01T00:00:00Z')
//   },
//   {
//     peer: 'foo',
//     id: 'b',
//     title: 'Article B',
//     lead:
//       'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper hendrerit tortor non feugiat.',
//     publishedDate: new Date('2019-02-01T00:00:00Z')
//   },
//   {
//     id: 'c',
//     title: 'Article C',
//     lead:
//       'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper hendrerit tortor non feugiat.',
//     publishedDate: new Date('2019-02-01T00:00:00Z')
//   }
// ]

// const mockPeers: Peer[] = [
//   {
//     id: 'a',
//     name: 'test',
//     url: 'http://localhost:3030'
//   }
// ]

const server = createServer(
  createAPIHandler({
    peerFetchTimeout: 200,
    adapter: new MockAdapter()
  })
)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

server.listen(port, address)
console.log(`API server listening on: http://${address}:${port}`)
