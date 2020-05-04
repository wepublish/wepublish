#!/usr/bin/env node
import os from 'os'
import cluster from 'cluster'
import {asyncMain} from './server'

if (process.env.NODE_ENV !== 'development') {
  if (cluster.isMaster) {
    const numWorkers = process.env.NUM_WORKERS || os.cpus().length

    for (let i = 0; i < numWorkers; i++) {
      cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
      console.info(`Worker ${worker.process.pid} exited with status: ${code}`)
    })
  } else {
    asyncMain()
      .then(() => {
        console.info(`Started worker ${process.pid}`)
      })
      .catch(err => {
        console.error(`Couldn't start worker ${process.pid}:`)
        console.error(err)
      })
  }
} else {
  asyncMain().catch(err => {
    console.error(err)
    process.exit(0)
  })
}
