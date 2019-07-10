import path from 'path'
import fastify from 'fastify'

import {render} from './render'
import {preloadAllLazyComponents} from '../common/lazy'

export interface ServerOptions {
  port?: number
  address?: string
  staticDirPath?: string

  clientEntryURL: string
  clientModuleMapPath?: string
}

export class Server {
  private readonly port: number
  private readonly address: string

  private readonly staticDirPath?: string
  private readonly clientEntryURL: string

  private readonly clientModuleMapPath?: string

  constructor(opts: ServerOptions) {
    this.port = opts.port || 3000
    this.address = opts.address || 'localhost'

    // TODO: Check for absolute paths
    this.clientModuleMapPath = opts.clientModuleMapPath
    this.staticDirPath = opts.staticDirPath
    this.clientEntryURL = opts.clientEntryURL
  }

  async listen(): Promise<void> {
    const server = fastify()

    await preloadAllLazyComponents()

    const moduleMap = this.clientModuleMapPath && (await import(this.clientModuleMapPath))

    server.get('/', async (_req, reply) => {
      reply.type('text/html')

      const [componentString, renderedPaths] = await render()
      const bundles = renderedPaths.map(path => moduleMap[path])
      const bundleSet = Array.from(
        new Set(bundles.map(urls => urls.map((url: string) => url)))
      ).filter(url => url !== this.clientEntryURL)

      return `
        <html>
          <head>
            ${bundleSet.map(url => `<script async src="${url}"></script>`).join('\n')}
            <script async src="${this.clientEntryURL}"></script>
            <script id="renderedKeys" type="application/json">${JSON.stringify(
              renderedPaths
            )}</script>
          </head>
          <body><div id="reactRoot">${componentString}</div></body>
        </html>
      `
    })

    await server.listen(this.port, this.address)
  }
}
