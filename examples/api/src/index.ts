#!/usr/bin/env node
import {createServer} from 'http'
import wepublish from '@wepublish/api'
import MockAdapter from '@wepublish/api-adapter-mock'

const server = createServer(
  wepublish({
    adapter: new MockAdapter()
  })
)

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

server.listen(port, address)
