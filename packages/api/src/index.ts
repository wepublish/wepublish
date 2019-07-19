import {RequestListener, IncomingMessage, OutgoingMessage} from 'http'
import createRouter from 'find-my-way'

export interface Adapter {}
export interface HandlerOptions {
  adapter: Adapter
}

export function createAPIHandler(opts: HandlerOptions): RequestListener {
  const router = createRouter()

  router.on('GET', '/', (req, res) => {
    const test = JSON.stringify({test: '123'})

    res.setHeader('content-type', 'application/json')
    res.setHeader('content-length', Buffer.byteLength(test))

    res.write(test)
    res.end()
  })

  return (req, res) => {
    router.lookup(req, res)
  }
}

export default createAPIHandler
