#!/usr/bin/env node
import {
  WepublishServer,
  URLAdapter,
  PublicArticle,
  PublicPage,
  Author,
  Oauth2Provider,
  MailgunMailProvider
} from '@wepublish/api'

import {KarmaMediaAdapter} from '@wepublish/api-media-karma'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb'

import {URL} from 'url'

interface ExampleURLAdapterProps {
  websiteURL: string
}

class ExampleURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: ExampleURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/article/${article.id}/${article.slug}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug || author.id}`
  }
}

async function asyncMain() {
  if (!process.env.MONGO_URL) throw new Error('No MONGO_URL defined in environment.')
  if (!process.env.HOST_URL) throw new Error('No HOST_URL defined in environment.')

  const hostURL = process.env.HOST_URL
  const websiteURL = process.env.WEBSITE_URL ?? 'https://wepublish.ch'

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
      const adminUserRole = await adapter.userRole.getUserRole('Admin')
      const adminUserRoleId = adminUserRole ? adminUserRole.id : 'fake'
      const editorUserRole = await adapter.userRole.getUserRole('Editor')
      const editorUserRoleId = editorUserRole ? editorUserRole.id : 'fake'

      await adapter.user.createUser({
        input: {
          email: 'dev@wepublish.ch',
          name: 'Dev User',
          roleIDs: [adminUserRoleId]
        },
        password: '123'
      })

      await adapter.user.createUser({
        input: {
          email: 'editor@wepublish.ch',
          name: 'Editor User',
          roleIDs: [editorUserRoleId]
        },
        password: '123'
      })
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

  if (!process.env.MAILGUN_API_KEY) throw new Error('No MAILGUN_API_KEY defined in environment.')
  if (!process.env.MAILGUN_BASE_URL) throw new Error('No MAILGUN_BASE_URL defined in environment.')
  if (!process.env.MAILGUN_WEBHOOK_SECRET)
    throw new Error('No MAILGUN_WEBHOOK_SECRET defined in environment.')

  if (!process.env.MAILCHIMP_API_KEY)
    throw new Error('No MAILCHIMP_API_KEY defined in environment.')
  if (!process.env.MAILCHIMP_WEBHOOK_SECRET)
    throw new Error('No MAILCHIMP_WEBHOOK_SECRET defined in environment.')

  const mailgunMailProvider = new MailgunMailProvider({
    id: 'mailgun',
    name: 'Mailgun',
    fromAddress: 'mails@wepublish.media',
    webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET,
    baseURL: process.env.MAILGUN_BASE_URL,
    apiKey: process.env.MAILGUN_API_KEY
  })

  /* const mailchimpMailProvider = new MailchimpMailProvider({
    id: 'mailchimp',
    name: 'Mailchimp Mandrill',
    fromAddress: 'mails@wepublish.media',
    webhookEndpointSecret: process.env.MAILCHIMP_WEBHOOK_SECRET,
    baseURL: 'test',
    apiKey: process.env.MAILCHIMP_API_KEY
  }) */

  const server = new WepublishServer({
    hostURL,
    websiteURL,
    mediaAdapter,
    dbAdapter,
    oauth2Providers,
    mailProvider: mailgunMailProvider,
    urlAdapter: new ExampleURLAdapter({websiteURL}),
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
