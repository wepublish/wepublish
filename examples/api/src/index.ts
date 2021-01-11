#!/usr/bin/env node
import {
  WepublishServer,
  URLAdapter,
  PublicComment,
  PublicArticle,
  PublicPage,
  Author,
  Oauth2Provider,
  MailgunMailProvider
} from '@wepublish/api'

import {KarmaMediaAdapter} from '@wepublish/api-media-karma'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb'

import {URL} from 'url'
import {SlackMailProvider} from './SlackMailProvider'

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

  getCommentURL(article: PublicArticle, comment: PublicComment) {
    return `${this.websiteURL}/article/${article.id}/${article.slug}#${comment.id}`
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

  let mailProvider
  if (
    process.env.MAILGUN_API_KEY &&
    process.env.MAILGUN_BASE_DOMAIN &&
    process.env.MAILGUN_MAIL_DOMAIN &&
    process.env.MAILGUN_WEBHOOK_SECRET
  ) {
    mailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      fromAddress: 'dev@wepublish.ch',
      webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET,
      baseDomain: process.env.MAILGUN_BASE_DOMAIN,
      mailDomain: process.env.MAILGUN_MAIL_DOMAIN,
      apiKey: process.env.MAILGUN_API_KEY
    })
  }

  if (process.env.SLACK_DEV_MAIL_WEBHOOK_URL) {
    mailProvider = new SlackMailProvider({
      id: 'slackMail',
      name: 'Slack Mail',
      fromAddress: 'fakeMail@wepublish.media',
      webhookURL: process.env.SLACK_DEV_MAIL_WEBHOOK_URL
    })
  }

  const server = new WepublishServer({
    hostURL,
    websiteURL,
    mediaAdapter,
    dbAdapter,
    oauth2Providers,
    mailProvider,
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
