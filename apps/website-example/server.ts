import 'dotenv/config'

import fs from 'fs'
import path from 'path'

import express from 'express'

import {renderMarkup} from './src/main.server'
import {matchRoute} from './src/app/route/routeContext'

import {fetch} from 'cross-fetch'

import os from 'os'
import cluster from 'cluster'
import cors from 'cors'

let cachedIntrospectionQuery: any = null

// See: https://www.apollographql.com/docs/react/data/fragments/#fragments-on-unions-and-interfaces
export async function fetchIntrospectionQueryResultData(url: string) {
  if (cachedIntrospectionQuery) return cachedIntrospectionQuery

  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      variables: {},
      query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `
    })
  })

  const result = await response.json()

  const filteredData = result.data.__schema.types.filter((type: any) => type.possibleTypes !== null)
  result.data.__schema.types = filteredData

  cachedIntrospectionQuery = result.data

  return result.data
}

export async function runServerInstance() {
  const canonicalHost = process.env.CANONICAL_HOST

  if (!canonicalHost) throw new Error('No "CANONICAL_HOST" defined in environment.')

  const allowedHosts = (process.env.ALLOWED_HOSTS || '').split(',')

  if (!process.env.API_URL) throw new Error('No API_URL defined in the environment.')

  const apiURL = process.env.API_URL + '/v1'

  const app = express()
  app.use(cors())

  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
      if (!req.hostname || !allowedHosts.includes(req.hostname)) {
        res.status(400).send('Host not allowed!')
        return
      }
    }

    next()
  })

  const browserDist = path.join(process.cwd(), 'dist/apps/website-example/browser')
  app.get('*.*', express.static(browserDist, {}))

  app.get('/robots.txt', async (req, res) => {
    res.sendFile(path.resolve(browserDist, 'assets/robots.txt'))
  })

  app.get('*', async (req, res) => {
    const url = `${req.protocol}://${req.headers.host}${req.originalUrl}`
    let introspectionQueryResultData
    try {
      introspectionQueryResultData = await fetchIntrospectionQueryResultData(apiURL)
    } catch (err) {
      console.warn('Fetch Introspect Error', err)
    }

    const initialRoute = matchRoute(url)

    const {markup, error} = await renderMarkup({
      apiURL,
      canonicalHost,
      initialRoute,
      introspectionQueryResultData
    })

    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.setHeader('content-length', Buffer.byteLength(markup))

    res.status(error ? 500 : 200).send(markup)
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 4200
  const address = process.env.ADDRESS || 'localhost'

  app.listen(port, address)

  console.log(`Server listening: http://${address}:${port}`)
}

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
    runServerInstance()
      .then(() => {
        console.info(`Started worker ${process.pid}`)
      })
      .catch(err => {
        console.error(`Couldn't start worker ${process.pid}:`)
        console.error(err)
      })
  }
} else {
  runServerInstance().catch(err => {
    console.error(err)
    process.exit(0)
  })
}
