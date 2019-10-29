#!/usr/bin/env node
import {
  WepublishGraphQLSchema,
  contextFromRequest,
  AdapterNavigationLinkType,
  ArticleVersionState,
  generateIDSync,
  BlockType
} from '@wepublish/api'

import {ApolloServer} from 'apollo-server'

import MockAdapter from '@wepublish/api-adapter-memory'

async function asyncMain() {
  const adapter = new MockAdapter({
    users: [{id: '123', email: 'dev@wepublish.ch', password: '123'}]
  })

  const testImage = await adapter.createImage({
    id: generateIDSync(),
    title: 'Test',
    description: 'test',
    extension: 'png',
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
    featuredBlock: {
      type: BlockType.Image,
      key: '0',
      image: {description: '123', imageID: testImage.id}
    },
    blocks: [
      {
        type: BlockType.RichText,
        key: '1',
        richText: {object: 'document', nodes: [], key: '1'}
      },
      {type: BlockType.Image, key: '2', image: {description: '123', imageID: testImage.id}},
      {
        type: BlockType.ImageGallery,
        key: '3',
        images: [{description: '123', imageID: testImage.id}]
      },
      {
        type: BlockType.FacebookPost,
        key: '4',
        postID: '123',
        userID: '123'
      }
    ]
  })

  const page = await adapter.createPage({
    id: generateIDSync(),
    title: 'Test',
    slug: 'test',
    publishDate: new Date(),
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    state: ArticleVersionState.Published,
    blocks: [
      {type: BlockType.Image, key: '0', image: {description: '123', imageID: testImage.id}},
      {type: BlockType.RichText, key: '1', richText: {object: 'document', nodes: [], key: '1'}},
      {
        type: BlockType.ArticleGrid,
        key: '2',
        articles: [{articleID: article.id}, {articleID: article.id}, {articleID: article.id}],
        numColumns: 3
      }
    ]
  })

  await adapter.createNavigation({
    key: 'test',
    name: 'Test',
    links: [
      {type: AdapterNavigationLinkType.Article, label: '123', articleID: article.id},
      {type: AdapterNavigationLinkType.Page, label: '123', pageID: page.id}
    ]
  })

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost'

  const server = new ApolloServer({
    cors: {
      origin: '*',
      allowedHeaders: ['content-type', 'content-length', 'accept', 'origin', 'user-agent'],
      methods: ['POST', 'GET', 'OPTIONS']
    },
    schema: WepublishGraphQLSchema,
    tracing: true,

    context: ({req}) =>
      contextFromRequest(req, {
        adapter
      })
  })

  server.listen(port, address).then(({url}) => {
    console.log(`Server ready at ${url}`)
  })
}

asyncMain()
