import path from 'path'
import fastify from 'fastify'
import {ComponentType} from 'react'

import {preloadAllLazyComponents} from '@wepublish/react'
import {RouteType} from '../shared'
import {renderApp} from './render'

export interface ListenResult {
  port: number
  address: string
  close: () => void
}

export interface ModuleBundleMap {
  [path: string]: string
}

export interface ServerOptions {
  port?: number
  address?: string

  apiURL: string
  staticDirPath?: string
  staticHost?: string

  clientEntryFile: string
  moduleBundleMap?: ModuleBundleMap

  appComponent: ComponentType<{}>
}

export class Server {
  private readonly port: number
  private readonly address: string

  // TODO
  private readonly staticDirPath?: string
  private readonly staticHost?: string
  private readonly clientEntryFile: string

  private readonly moduleBundleMap?: ModuleBundleMap

  private readonly appComponent: ComponentType<{}>

  constructor(opts: ServerOptions) {
    this.port = opts.port || 3000
    this.address = opts.address || 'localhost'

    if (opts.staticDirPath && !path.isAbsolute(opts.staticDirPath))
      throw new Error('"staticDirPath" should be an absolute path.')

    this.moduleBundleMap = opts.moduleBundleMap
    this.staticDirPath = opts.staticDirPath
    this.staticHost = opts.staticHost || '/static'
    this.clientEntryFile = opts.clientEntryFile

    this.appComponent = opts.appComponent
  }

  async listen(): Promise<ListenResult> {
    const server = fastify()

    await preloadAllLazyComponents()

    const moduleMap = this.moduleBundleMap || {}

    // Root route
    server.get('/', async (request, reply) => {
      reply.type('text/html')

      const {componentString, renderedLazyPaths} = await renderApp({
        initialRoute: {type: RouteType.Article},
        appComponent: this.appComponent
      })

      const bundles: string[] = renderedLazyPaths.map(path => moduleMap[path])
      const bundleSet = Array.from(
        new Set(bundles.reduce((acc, file) => [...acc, file], [] as string[]))
      ).filter(url => url !== this.clientEntryFile)

      return `
        <html>
          <head>
            ${bundleSet
              .map(url => `<script async src="${this.staticHost}/${url}"></script>`)
              .join('\n')}
            <script async src="${this.staticHost}/${this.clientEntryFile}"></script>
            <script id="renderedKeys" type="application/json">${JSON.stringify(
              renderedLazyPaths
            )}</script>
          </head>
          <body><div id="reactRoot">${componentString}</div></body>
        </html>
      `
    })

    // Route API route
    server.get('/api/route/*', async (request, reply) => {
      return request.params['*']
    })

    await server.listen(this.port, this.address)

    return {
      port: this.port,
      address: this.address
    }
  }
}

export async function startServer(opts: ServerOptions): Promise<ListenResult> {
  return new Server(opts).listen()
}
