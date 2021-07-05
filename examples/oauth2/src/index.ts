#!/usr/bin/env node

import {MongoDBAdapter} from '@wepublish/api-db-mongodb'

import {Oauth2Server} from '@wepublish/oauth2'
import path from 'path'

async function asyncMain() {
  if (!process.env.OAUTH_MONGODB_URI) {
    throw new Error('No OAUTH_MONGODB_URI defined in ENV')
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4100
  const address = process.env.ADDRESS || 'localhost'

  if (!process.env.MONGO_URL) {
    throw new Error('No MONGO_URL defined in ENV')
  }

  const dbAdapter = await MongoDBAdapter.connect({
    url: process.env.MONGO_URL,
    locale: process.env.MONGO_LOCALE ?? 'en'
  })

  if (!process.env.JWKS_KEYS) {
    throw new Error('No JWKS Keys defined in process.env.JWKS_Keys')
  }

  if (
    !process.env.OAUTH_CLIENT_ID ||
    !process.env.OAUTH_CLIENT_SECRET ||
    !process.env.OAUTH_GRANT_TYPES ||
    !process.env.OAUTH_REDIRECT_URIS ||
    !process.env.OAUTH_COOKIE_KEYS ||
    !process.env.JWKS_KEYS
  ) {
    throw new Error('Missing some configurations for OAuth2 Provider')
  }

  const oauth2Server = new Oauth2Server({
    issuer: process.env.ISSUER ?? `http://localhost:${PORT}`,
    debug: true,
    wepublishDDAdapter: dbAdapter,
    mongoUrlOauth2: process.env.OAUTH_MONGODB_URI,
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    grantTypes: process.env.OAUTH_GRANT_TYPES.split(','),
    redirectUris: process.env.OAUTH_REDIRECT_URIS.split(','),
    cookieKeys: process.env.OAUTH_COOKIE_KEYS.split(','),
    jwksKeys: JSON.parse(process.env.JWKS_KEYS),
    viewPath: path.join(__dirname, '..', 'customViews')
  })

  await oauth2Server.listen(PORT, address)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
