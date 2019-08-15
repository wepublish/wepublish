#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import {createServer} from 'http'

import {createWebsiteHandler} from '@wepublish/react/server'
import {findEntryFromAssetList} from '@karma.run/webpack'

import {App} from '../common'

async function asyncMain() {
  const staticHost = process.env.STATIC_HOST

  const moduleMap = JSON.parse(
    await fs.promises.readFile(path.resolve(__dirname, '../moduleMap.json'), 'utf-8')
  )

  const assetList = JSON.parse(
    await fs.promises.readFile(path.resolve(__dirname, '../assetList.json'), 'utf-8')
  )

  const entry = findEntryFromAssetList('client', assetList)

  if (!entry) throw new Error("Couldn't find entry in asset list.")

  if (!process.env.API_URL) {
    throw new Error('No API_URL defined in the environment.')
  }

  const server = createServer(
    await createWebsiteHandler({
      apiURL: process.env.API_URL,
      port: process.env.PORT != undefined ? parseInt(process.env.PORT) : undefined,
      address: process.env.ADDRESS,
      staticDirPath: staticHost ? undefined : path.resolve(__dirname, '../static'),
      staticHost: staticHost || '/static',
      clientEntryFile: entry,
      moduleBundleMap: moduleMap,
      appComponent: App
    })
  )

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
  const address = process.env.ADDRESS || 'localhost'

  server.listen(port, address)

  console.log(`Server listening: http://${address}:${port}`)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
