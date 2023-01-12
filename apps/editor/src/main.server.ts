import type {Request, Response} from 'express'
import * as fs from 'fs'

import {ElementID} from './shared/elementID'

let indexHtml: null | string = null

export function handleRequest(indexPath: string) {
  return function render(req: Request, res: Response) {
    const clientSettings = {
      apiURL: process.env.API_URL,
      peerByDefault: process.env.PEER_BY_DEFAULT?.toLowerCase() === 'true',
      imgMinSizeToCompress: process.env.IMG_MIN_SIZE_TO_COMPRESS
        ? parseInt(process.env.IMG_MIN_SIZE_TO_COMPRESS)
        : 10
    }

    const clientSettingsHTML = `
      <script
        type="application/json"
        id="${ElementID.Settings}"
      >${JSON.stringify(clientSettings)}</script>
    `

    if (!indexHtml || process.env.NODE_ENV !== 'production') {
      indexHtml = fs.readFileSync(indexPath).toString()
    }

    const [htmlStart, htmlEnd] = indexHtml.split(`</head>`)

    const markup = `${htmlStart}${clientSettingsHTML}</head>${htmlEnd}`
    res.header('content-type', 'text/html; charset=UTF-8')
    res.header('content-length', Buffer.byteLength(markup).toString())
    res.send(markup)
  }
}
