import {runServer} from './app'

runServer().catch(err => {
  console.error(err)
  process.exit(1)
})
