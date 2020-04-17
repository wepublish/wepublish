#!/usr/bin/env node
import {
  WepublishServer,
  URLAdapter,
  PublicArticle,
  PublicPage,
  Author,
  Oauth2Provider
} from '@wepublish/api'

import {KarmaMediaAdapter} from '@wepublish/api-media-karma'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb'

import startMediaServer from '@karma.run/media'
import LocalStorageBackend from '@karma.run/media-storage-local'
import SharpImageBackend from '@karma.run/media-image-sharp'

import {URL} from 'url'
import {resolve as resolvePath} from 'path'

class ExampleURLAdapter implements URLAdapter {
  getPublicArticleURL(article: PublicArticle): string {
    return `https://wepublish.ch/article/${article.id}/${article.slug}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `https://wepublish.ch/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `https://wepublish.ch/author/${author.id}/${author.slug}`
  }
}

async function asyncMain() {
  if (!process.env.MONGO_URL) throw new Error('No MONGO_URL defined in environment.')

  const port = process.env.PORT ? parseInt(process.env.PORT) : undefined
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const mediaStoragePath = process.env.MEDIA_STORAGE_PATH ?? resolvePath(__dirname, '../.media')
  const mediaServerToken = process.env.MEDIA_SERVER_TOKEN! || '123'
  const mediaServerPort = process.env.MEDIA_PORT ? parseInt(process.env.MEDIA_PORT) : 4001
  const mediaServerAddress = process.env.MEDIA_ADDRESS ?? 'localhost'

  const mediaServerURL = new URL(`http://${mediaServerAddress}:${mediaServerPort}`)
  const mediaAdapter = new KarmaMediaAdapter(mediaServerURL, mediaServerToken)

  await MongoDBAdapter.initialize({
    url: process.env.MONGO_URL!,
    locale: process.env.MONGO_LOCALE ?? 'en',
    seed: async adapter => {
      adapter.createUser({email: 'dev@wepublish.ch', password: '123'})
    }
  })

  const dbAdapter = await MongoDBAdapter.connect({
    url: process.env.MONGO_URL!,
    locale: process.env.MONGO_LOCALE ?? 'en'
  })

  const oauth2Providers: Oauth2Provider[] = [
    {
      name: 'google',
      discoverUrl: 'https://accounts.google.com',
      clientId: '617896178757-i6ldn0nni9qtle8o6eu76lv93d78nvfi.apps.googleusercontent.com',
      clientKey: 't267ZLqkV9dacrkPQp_pF-G2',
      redirectUri: ['http://localhost:4000/auth/google'],
      scopes: ['openid profile email']
    },
    {
      name: 'wepublish',
      discoverUrl: 'http://localhost:4100/.well-known/openid-configuration',
      clientId: 'wepublish_demo_wepublish_media',
      clientKey: 'ThisIsASuperSecret',
      redirectUri: ['http://localhost:4000/auth/wepublish'],
      scopes: ['openid profile email']
    }
  ]

  const server = new WepublishServer({
    mediaAdapter,
    dbAdapter,
    oauth2Providers,
    urlAdapter: new ExampleURLAdapter(),
    playground: true,
    introspection: true,
    tracing: true
  })

  await startMediaServer({
    storageBackend: new LocalStorageBackend(mediaStoragePath),
    imageBackend: new SharpImageBackend(),
    maxUploadSize: 1024 * 1024 * 10,
    port: mediaServerPort,
    address: mediaServerAddress,
    token: mediaServerToken,
    logger: false
  })

  await server.listen(port, address)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
