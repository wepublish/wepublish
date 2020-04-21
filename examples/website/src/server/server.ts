import 'dotenv/config'

import fs from 'fs'
import path from 'path'

import express from 'express'

import {findEntryFromAssetList} from '@karma.run/webpack'
import {renderMarkup} from './render'
import {matchRoute} from '../shared/route/routeContext'

import {fetch} from 'cross-fetch'
import {MailchimpCampaignData} from '../shared/appContext'

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

export async function asyncMain() {
  const canonicalHost = process.env.CANONICAL_HOST

  if (!canonicalHost) throw new Error('No "CANONICAL_HOST" defined in environment.')

  const assetHost = process.env.ASSETS_HOST || '/assets'
  const allowedHosts = (process.env.ALLOWED_HOSTS || '').split(',')

  const moduleMap: Record<string, string[]> = JSON.parse(
    await fs.promises.readFile(path.resolve(__dirname, '../moduleMap.json'), 'utf-8')
  )

  const assetList: Record<string, string[]> = JSON.parse(
    await fs.promises.readFile(path.resolve(__dirname, '../assetList.json'), 'utf-8')
  )

  const clientEntryFile = findEntryFromAssetList('client', assetList)

  if (!clientEntryFile) throw new Error("Couldn't find entry in asset list.")

  const apiURL = process.env.API_URL

  if (!apiURL) throw new Error('No API_URL defined in the environment.')

  const app = express()

  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
      if (!req.hostname || !allowedHosts.includes(req.hostname)) {
        res.status(400).send('Host not allowed!')
        return
      }
    }

    next()
  })

  app.use(
    '/.well-known/assetlinks.json',
    express.static(path.resolve(__dirname, '../../static/assetlinks.json'))
  )

  app.use('/static', express.static(path.resolve(__dirname, '../../static/')))
  app.use('/assets', express.static(path.resolve(__dirname, '../../assets/')))

  app.get('/robots.txt', async (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../static/robots.txt'))
  })

  app.get('/api/latest-mailchimp-campaign', async (req, res) => {
    res.json(await getCurrentMailchimpCampaign())
  })

  app.get('/*', async (req, res) => {
    const url = `${req.protocol}://${req.headers.host}${req.originalUrl}`
    const introspectionQueryResultData = await fetchIntrospectionQueryResultData(apiURL)
    const initialRoute = matchRoute(url)

    const {markup, error} = await renderMarkup({
      apiURL,
      canonicalHost,
      moduleMap,
      initialRoute,
      clientEntryFile,
      introspectionQueryResultData,
      staticHost: assetHost
    })

    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.setHeader('content-length', Buffer.byteLength(markup))

    res.status(error ? 500 : 200).send(markup)
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000
  const address = process.env.ADDRESS || 'localhost'

  app.listen(port, address)

  console.log(`Server listening: http://${address}:${port}`)
}

export async function getCurrentMailchimpCampaign(): Promise<MailchimpCampaignData | null> {
  const mailchimpRegion = process.env.MAILCHIMP_REGION
  const folderID = process.env.MAILCHIMP_FOLDER_ID
  const apiKey = process.env.MAILCHIMP_API_KEY

  if (!folderID || !apiKey || !mailchimpRegion) {
    console.warn(
      'Missing Mailchimp environment variables, ensure ' +
        'MAILCHIMP_REGION , MAILCHIMP_FOLDER_ID and MAILCHIMP_API_KEY are set.'
    )

    return null
  }

  const query = new URLSearchParams()

  query.set('folder_id', `${folderID}`)
  query.set('sort_field', 'send_time')
  query.set('sort_dir', 'DESC')
  query.set('count', '1')
  query.set('fields', 'campaigns.id,campaigns.send_time,campaigns.long_archive_url')
  query.toString()

  const baiscauth = Buffer.from(`anystring:${apiKey}`).toString('base64')

  try {
    const response = await fetch(
      `https://${mailchimpRegion}.api.mailchimp.com/3.0/campaigns?${query}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${baiscauth}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )

    if (response.status < 200 || response.status > 299) {
      console.error(`Error while fetching Mailchimp campaigns: ${response.status}`)
      return null
    }

    const data = await response.json()

    const currentDate = new Date()
    const dateTimeCampain = new Date(data.campaigns[0]['send_time'])

    if (
      data.campaigns.length > 0 &&
      currentDate.getUTCDate() == dateTimeCampain.getUTCDate() &&
      currentDate.getUTCMonth() == dateTimeCampain.getUTCMonth() &&
      currentDate.getUTCFullYear() == dateTimeCampain.getUTCFullYear()
    ) {
      const {id, long_archive_url, send_time} = data.campaigns[0]

      return {
        id,
        longArchiveURL: long_archive_url,
        sendTime: send_time
      }
    }

    return null
  } catch (err) {
    console.error('Error while fetching Mailchimp campaigns:', err)
    return null
  }
}
