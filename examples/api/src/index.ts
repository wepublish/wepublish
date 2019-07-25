#!/usr/bin/env node
import {createServer} from 'http'
import wepublish, {Article} from '@wepublish/api'
import MockAdapter from '@wepublish/api-adapter-mock'

const mockArticles: Article[] = [
  {
    id: 'a',
    title: 'Article A',
    lead:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper hendrerit tortor non feugiat.'
  },
  {
    id: 'b',
    title: 'Article B',
    lead:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper hendrerit tortor non feugiat.'
  },
  {
    id: 'c',
    title: 'Article C',
    lead:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper hendrerit tortor non feugiat.'
  }
]

const server = createServer(
  wepublish({
    adapter: new MockAdapter({
      articles: mockArticles
    })
  })
)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

server.listen(port, address)
console.log(`API server listening on: http://${address}:${port}`)
