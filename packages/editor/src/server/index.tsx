#!/usr/bin/env node
import React from 'react'

import fs from 'fs'
import path, {join as joinPath} from 'path'

import express from 'express'
import {renderToStaticMarkup} from 'react-dom/server'

import {findEntryFromAssetList} from '@karma.run/webpack'
import {ElementID} from '../shared/elementID'

async function asyncMain() {
  const assetHost = process.env.ASSET_HOST || '/assets'

  const assetList = JSON.parse(
    await fs.promises.readFile(path.resolve(__dirname, '../assetList.json'), 'utf-8')
  )

  const entry = findEntryFromAssetList('client', assetList)

  if (!entry) throw new Error("Couldn't find entry in asset list.")

  const app = express()

  app.use('/assets', express.static(joinPath(__dirname, '../../assets'), {index: false}))

  app.get('/*', (_req, res) => {
    const markup = renderToStaticMarkup(
      <html>
        <head>
          <link
            href="https://fonts.googleapis.com/css?family=Open+Sans:400,400i,700,700i&display=swap"
            rel="stylesheet"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script async src={`${assetHost}/${entry}`} crossOrigin=""></script>
        </head>
        <body>
          <div id={ElementID.ReactRoot}></div>
        </body>
      </html>
    )

    res.header('content-type', 'text/html; charset=UTF-8')
    res.header('content-length', Buffer.byteLength(markup).toString())
    res.send(markup)
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
  const address = process.env.ADDRESS || 'localhost'

  app.listen(port, address)

  console.log(`Server listening: http://${address}:${port}`)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
