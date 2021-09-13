#!/usr/bin/env node
import os from 'os'
import cluster from 'cluster'
import startMediaServer from '@karma.run/media'
import LocalStorageBackend from '@karma.run/media-storage-local'
import SharpImageBackend from '@karma.run/media-image-sharp'

if (cluster.isMaster) {
  const numClusters = process.env.NUM_CLUSTERS
    ? parseInt(process.env.NUM_CLUSTERS)
    : os.cpus().length

  for (let i = 0; i < numClusters; i++) {
    cluster.fork()
  }
} else {
  if (!process.env.TOKEN) {
    console.error('No TOKEN defined in the environment.')
    process.exit(1)
  }

  if (!process.env.STORAGE_PATH) {
    console.error('No STORAGE_PATH is defined in the environment.')
    process.exit(1)
  }

  const token = process.env.TOKEN!
  const storagePath = process.env.STORAGE_PATH!

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3004
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const debug = Boolean(process.env.DEBUG)

  startMediaServer({
    storageBackend: new LocalStorageBackend(storagePath),
    imageBackend: new SharpImageBackend(),
    maxUploadSize: 1024 * 1024 * 10, // 10
    logger: false,
    port,
    address,
    debug,
    token
  })
}
