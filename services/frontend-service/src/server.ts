import {Server} from '@wepublish/frontend/server'

new Server({
  port: process.env.PORT != undefined ? parseInt(process.env.PORT) : undefined,
  address: process.env.ADDRESS,
  staticDirPath: '/static',
  clientEntryURL: '/'
})
  .listen()
  .then(() => {
    console.log('Server listening!')
  })
