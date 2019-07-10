import fs from 'fs'
import fastify from 'fastify'

import {render} from './render'
import {preload, renderedKeys} from '../common/lazy'

export interface ServerOptions {
  port?: number
  address?: string

  staticDirPath: string
  clientEntryURL: string
}

export class Server {
  private readonly port: number
  private readonly address: string

  constructor(opts: ServerOptions) {
    this.port = opts.port || 3000
    this.address = opts.address || 'localhost'
  }

  async listen(): Promise<void> {
    const server = fastify()

    await preload()

    // TEMP
    server.get('/static/client.js', async (_req, reply) => {
      reply.type('application/javascript')
      return fs.createReadStream('./static/client.js')
    })

    // TEMP
    server.get('/static/client.0.js', async (_req, reply) => {
      reply.type('application/javascript')
      return fs.createReadStream('./static/client.0.js')
    })

    server.get('/', async (_req, reply) => {
      reply.type('text/html')

      const componentString = render()

      return `
        <html>
          <head>
            <script async src="/static/client.js"></script>
            <script id="renderedKeys" type="application/json">${JSON.stringify(
              Object.keys(renderedKeys)
            )}</script>
          </head>
          <body><div id="reactRoot">${componentString}</div></body>
        </html>
      `
    })

    await server.listen(this.port, this.address)
  }
}
