#!/usr/bin/env node
import {WepublishServer, URLAdapter, PublicArticle, PublicPage, Author} from '@wepublish/api'

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

  const server = new WepublishServer({
    mediaAdapter,
    dbAdapter,
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
