import fs from 'fs'
import path from 'path'

import axios from 'axios'
import {startServer} from '@wepublish/react/server'
import {findEntryFromAssetList} from '@wepublish/webpack'

async function asyncMain() {
  const useWebpackDevServer = process.env.USE_WEBPACK_DEV_SERVER === 'true'
  const webpackHost = process.env.WEBPACK_HOST || 'http://localhost:3001'

  if (useWebpackDevServer) {
    while (true) {
      try {
        await axios.get(webpackHost)
        break
      } catch {
        console.log("Couldn't connect to the webpack dev server, retrying in 3s")
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }
  }

  const moduleMap = useWebpackDevServer
    ? (await axios.get(`${webpackHost}/static/moduleMap.json`)).data
    : JSON.parse(await fs.promises.readFile('../static/moduleMap.json', 'utf-8'))

  const assetList = useWebpackDevServer
    ? (await axios.get(`${webpackHost}/static/assetList.json`)).data
    : JSON.parse(await fs.promises.readFile('../static/assetList.json', 'utf-8'))

  const entry = findEntryFromAssetList('client', assetList)

  if (!entry) throw new Error("Couldn't find entry in asset list.")

  const {address, port} = await startServer({
    port: process.env.PORT != undefined ? parseInt(process.env.PORT) : undefined,
    address: process.env.ADDRESS,
    staticDirPath: path.resolve(__dirname, '../static'),
    staticHost: webpackHost + '/static',
    clientEntryFile: entry,
    moduleBundleMap: moduleMap
  })

  console.log(`Server listening: http://${address}:${port}`)
}

asyncMain()
