import path from 'path'
import {Server} from '@wepublish/website/server'

new Server({
  port: process.env.PORT != undefined ? parseInt(process.env.PORT) : undefined,
  address: process.env.ADDRESS,
  staticDirPath: path.resolve(__dirname, '../static'),
  clientEntryURL:
    process.env.NODE_ENV === 'production'
      ? '/static/client.js'
      : 'http://localhost:3001/static/client.js',
  clientModuleMapPath: path.resolve(__dirname, './clientModuleMap.json')
})
  .listen()
  .then(() => {
    console.log('Server listening!')
  })
