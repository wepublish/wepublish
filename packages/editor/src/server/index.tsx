#!/usr/bin/env node
import React from 'react'

import fs from 'fs'
import path, {isAbsolute as isAbsolutePath, join as joinPath} from 'path'
import send from 'send'

import {createServer} from 'http'
import createRouter from 'find-my-way'
import {renderToStaticMarkup} from 'react-dom/server'

import {findEntryFromAssetList} from '@karma.run/webpack'
import {ElementID} from '../shared/elementID'

async function asyncMain() {
  const staticHost = process.env.STATIC_HOST || '/static'

  const assetList = JSON.parse(
    await fs.promises.readFile(path.resolve(__dirname, '../assetList.json'), 'utf-8')
  )

  const entry = findEntryFromAssetList('client', assetList)

  if (!entry) throw new Error("Couldn't find entry in asset list.")

  const router = createRouter()

  router.on('GET', '/static*', (req, res, params) => {
    const path = params['*']!

    if (isAbsolutePath(path)) {
      send(req, path, {root: joinPath(__dirname, '../../static'), index: false}).pipe(res)
    } else {
      res.statusCode = 400
      res.end()
    }
  })

  router.on('GET', '/*', (req, res) => {
    const markup = renderToStaticMarkup(
      <html>
        <head>
          <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:400,400i,700,700i&display=swap"
            rel="stylesheet"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script async src={`${staticHost}/${entry}`} crossOrigin=""></script>
        </head>
        <body>
          <div id={ElementID.ReactRoot}></div>
        </body>
      </html>
    )

    res.setHeader('content-type', 'text/html; charset=UTF-8')
    res.setHeader('content-length', Buffer.byteLength(markup))

    res.write(markup)
    res.end()
  })

  const server = createServer((req, res) => {
    router.lookup(req, res)
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
  const address = process.env.ADDRESS || 'localhost'

  server.listen(port, address)

  console.log(`Server listening: http://${address}:${port}`)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
