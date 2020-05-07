#!/usr/bin/env node

import express from 'express'
import * as path from 'path'
import {Provider} from 'oidc-provider'
import {MongoDBAdapter as OAuth2DBAdapter} from './adapter'
import {routes} from './routes'
import {configuration} from './configuration'
import url from 'url'
import {MongoDBAdapter as WepublishDBAdapter} from '@wepublish/api-db-mongodb'
import set from 'lodash/set'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4100
const {ISSUER = `http://localhost:${PORT}`} = process.env

const ONE_DAY_IN_MS = 1 * 24 * 60 * 60 * 1000

async function asyncMain() {
  if (process.env.OAUTH_MONGODB_URI) {
    await OAuth2DBAdapter.initialize(process.env.OAUTH_MONGODB_URI, 'en')
    await OAuth2DBAdapter.connect(process.env.OAUTH_MONGODB_URI)
  }

  const dbAdapter = await WepublishDBAdapter.connect({
    url: process.env.MONGO_URL!,
    locale: process.env.MONGO_LOCALE ?? 'en'
  })

  if (!process.env.JWKS_KEYS) {
    throw new Error('No JWKS Keys defined in process.env.JWKS_Keys')
  }

  const app = express()

  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  const findAccount = async function (ctx: any, id: any) {
    const user = await dbAdapter.user.getUserByID(id)
    if (user) {
      return {
        accountId: user.id,
        email: user.email,
        async claims(use: any, scope: any) {
          console.log('claims', use, scope)
          return {sub: user.email, email: user.email}
        }
      }
    } else {
      throw new Error('did not find user')
    }
  }

  if (
    !process.env.OAUTH_CLIENT_ID ||
    !process.env.OAUTH_CLIENT_SECRET ||
    !process.env.OAUTH_GRANT_TYPES ||
    !process.env.OAUTH_REDIRECT_URIS ||
    !process.env.OAUTH_COOKIE_KEYS
  ) {
    throw new Error('Missing some configurations for OAuth2 Provider')
  }
  const config = {
    adapter: OAuth2DBAdapter,
    clients: [
      {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        grant_types: process.env.OAUTH_GRANT_TYPES.split(','),
        redirect_uris: process.env.OAUTH_REDIRECT_URIS.split(',')
      }
    ],
    cookies: {
      long: {signed: true, maxAge: ONE_DAY_IN_MS},
      short: {signed: true},
      keys: process.env.OAUTH_COOKIE_KEYS.split(',')
    },
    jwks: {
      keys: JSON.parse(process.env.JWKS_KEYS)
    },
    findAccount,
    ...configuration
  }
  const provider = new Provider(ISSUER, config)
  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy')
    provider.proxy = true
    set(configuration, 'cookies.short.secure', true)
    set(configuration, 'cookies.long.secure', true)

    app.use((req, res, next) => {
      if (req.secure) {
        next()
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        res.redirect(
          url.format({
            protocol: 'https',
            host: req.get('host'),
            pathname: req.originalUrl
          })
        )
      } else {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'do yourself a favor and only use https'
        })
      }
    })
  }

  routes(app, provider, dbAdapter)
  app.use(provider.callback)

  const address = process.env.ADDRESS || 'localhost'

  app.listen(PORT, address)

  console.log(`Server listening: http://${address}:${PORT}`)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
