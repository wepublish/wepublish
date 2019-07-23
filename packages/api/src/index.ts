import {RequestListener, IncomingMessage, OutgoingMessage} from 'http'
import createRouter from 'find-my-way'

export interface Adapter {
  getArticle(): any
  getArticles(): any
  createArticle(): any
  updateArticle(): any
}

export interface HandlerOptions {
  adapter: Adapter
}

export function createAPIHandler(opts: HandlerOptions): RequestListener {
  const router = createRouter()

  router.on('GET', '/', (req, res) => {
    const articles = opts.adapter.getArticles()
    const articlesJSON = JSON.stringify(articles)

    res.setHeader('content-type', 'application/json')
    res.setHeader('content-length', Buffer.byteLength(articlesJSON))

    res.write(articlesJSON)
    res.end()
  })

  return (req, res) => {
    router.lookup(req, res)
  }
}

export default createAPIHandler
