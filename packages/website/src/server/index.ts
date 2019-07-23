import {RequestListener} from 'http'
import createRouter from 'find-my-way'

import {ComponentType} from 'react'

import {preloadAllLazyComponents} from '@wepublish/react'
import {RouteType, ElementID} from '../shared'
import {renderApp} from './render'

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

export async function createWebsiteHandler(opts: ServerOptions): Promise<RequestListener> {
  const router = createRouter()
  const moduleBundleMap = opts.moduleBundleMap || {}

  await preloadAllLazyComponents()

  router.on('GET', '/*', async (req, res) => {
    const {componentString, renderedLazyPaths} = await renderApp({
      initialRoute: {type: RouteType.Article},
      appComponent: opts.appComponent
    })

    const bundles: string[] = renderedLazyPaths.map(path => moduleBundleMap[path])
    const bundleSet = Array.from(
      new Set(bundles.reduce((acc, file) => [...acc, file], [] as string[]))
    ).filter(url => url !== opts.clientEntryFile)

    const htmlString = `
    <html>
      <head>
        ${bundleSet
          .map(url => `<script async src="${opts.staticHost}/${url}"></script>`)
          .join('\n')}
        <script async src="${opts.staticHost}/${opts.clientEntryFile}"></script>
        <script id="${ElementID.RenderedPaths}" type="application/json">${JSON.stringify(
      renderedLazyPaths
    )}</script>
      </head>
      <body><div id="${ElementID.ReactRoot}">${componentString}</div></body>
    </html>
  `

    res.setHeader('content-type', 'text/html')
    res.setHeader('content-length', Buffer.byteLength(htmlString))

    res.write(htmlString)
    res.end()
  })

  return (req, res) => {
    router.lookup(req, res)
  }
}

export default createWebsiteHandler
