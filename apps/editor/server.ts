import cors from 'cors'
import express from 'express'
import * as path from 'path'

import {handleRequest} from './src/main.server'

if (!process.env.API_URL) throw new Error('No API_URL specified in environment.')

const port = process.env['PORT'] || 3000
const app = express()

const browserDist = path.join(process.cwd(), 'dist/apps/editor/browser')
const indexPath = path.join(browserDist, 'index.html')

app.use(cors())

app.get('*.*', express.static(browserDist, {}))

app.use('*', handleRequest(indexPath))

const server = app.listen(port, () => {
  // Server has started
})

server.on('error', console.error)
