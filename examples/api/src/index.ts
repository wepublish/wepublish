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

import {URL} from 'url'

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

  if (!process.env.MEDIA_SERVER_URL) {
    throw new Error('No MEDIA_SERVER_URL defined in environment.')
  }

  if (!process.env.MEDIA_SERVER_TOKEN) {
    throw new Error('No MEDIA_SERVER_TOKEN defined in environment.')
  }

  const mediaAdapter = new KarmaMediaAdapter(
    new URL(process.env.MEDIA_SERVER_URL),
    process.env.MEDIA_SERVER_TOKEN
  )

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
      discoverUrl: process.env.OAUTH_GOOGLE_DISCOVERY_URL ?? '',
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID ?? '',
      clientKey: process.env.OAUTH_GOOGLE_CLIENT_KEY ?? '',
      redirectUri: [process.env.OAUTH_GOOGLE_REDIRECT_URL ?? ''],
      scopes: ['openid profile email']
    },
    {
      name: 'wepublish',
      discoverUrl: process.env.OAUTH_WEPUBLISH_DISCOVERY_URL ?? '',
      clientId: process.env.OAUTH_WEPUBLISH_CLIENT_ID ?? '',
      clientKey: process.env.OAUTH_WEPUBLISH_CLIENT_KEY ?? '',
      redirectUri: [process.env.OAUTH_WEPUBLISH_REDIRECT_URL ?? ''],
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

  await server.listen(port, address)
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
