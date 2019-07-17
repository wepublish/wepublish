import fs from 'fs'
import path from 'path'

import {startServer} from '@wepublish/react/server'
import {findEntryFromAssetList} from '@wepublish/webpack'

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

  const {address, port} = await startServer({
    port: process.env.PORT != undefined ? parseInt(process.env.PORT) : undefined,
    address: process.env.ADDRESS,
    staticDirPath: staticHost ? undefined : path.resolve(__dirname, '../static'),
    staticHost: staticHost || '/static',
    clientEntryFile: entry,
    moduleBundleMap: moduleMap
  })

  console.log(`Server listening: http://${address}:${port}`)
}

asyncMain()
