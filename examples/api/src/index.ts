#!/usr/bin/env node
import {
  WepublishGraphQLSchema,
  contextFromRequest,
  generateIDSync,
  ArticleVersionState,
  BlockType,
  AdapterNavigationLinkType
} from '@wepublish/api'
import MockAdapter from '@wepublish/api-adapter-memory'

import {ApolloServer} from 'apollo-server'

async function asyncMain() {
  if (!process.env.MEDIA_SERVER_URL) {
    throw new Error('No MEDIA_SERVER_URL defined in environment.')
  }

  if (!process.env.MEDIA_SERVER_TOKEN) {
    throw new Error('No MEDIA_SERVER_TOKEN defined in environment.')
  }

  const adapter = new MockAdapter({
    users: [{id: generateIDSync(), email: 'dev@wepublish.ch', password: '123'}]
  })

  const testImage = await adapter.createImage({
    id: generateIDSync(),
    title: 'Test',
    description: 'test',
    extension: '.png',
    format: 'png',
    mimeType: 'image/png',
    fileSize: 1024,
    filename: 'test',
    width: 400,
    height: 200,
    host: 'dummyimage.com',
    url: 'https://dummyimage.com/600x400/000/fff',
    tags: []
  })

  const article = await adapter.createArticle({
    id: generateIDSync(),
    title: 'Test',
    slug: 'test',
    publishDate: new Date(),
    lead:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    state: ArticleVersionState.Published,
    blocks: [
      {
        type: BlockType.Image,
        key: '0',
        image: {imageID: testImage.id, description: ''}
      }
    ]
  })

  await adapter.createNavigation({
    key: 'main',
    name: 'Test',
    links: [{type: AdapterNavigationLinkType.Article, label: '123', articleID: article.id}]
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const mediaServerURL = process.env.MEDIA_SERVER_URL
  const mediaServerToken = process.env.MEDIA_SERVER_TOKEN

  const server = new ApolloServer({
    cors: {
      origin: '*',
      allowedHeaders: [
        'authorization',
        'content-type',
        'content-length',
        'accept',
        'origin',
        'user-agent'
      ],
      methods: ['POST', 'GET', 'OPTIONS']
    },
    schema: WepublishGraphQLSchema,
    tracing: true,

    context: ({req}) =>
      contextFromRequest(req, {
        adapter,
        mediaServerURL,
        mediaServerToken
      })
  })

  server.listen(port, address).then(({url}) => {
    console.log(`Server ready at ${url}`)
  })
}

asyncMain()
