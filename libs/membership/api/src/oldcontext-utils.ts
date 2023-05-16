import {
  AlgebraicCaptchaChallenge,
  Author,
  contextFromRequest,
  KarmaMediaAdapter,
  Oauth2Provider,
  PublicArticle,
  PublicComment,
  PublicPage,
  URLAdapter
} from '@wepublish/api'
import {MailchimpMailProvider} from '@wepublish/mails'
import {CommentItemType, Peer, PrismaClient} from '@prisma/client'
import process from 'process'
import {URL} from 'url'
import bodyParser from 'body-parser'
import {
  PaymentProvider,
  PayrexxPaymentProvider,
  PayrexxSubscriptionPaymentProvider,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider
} from '@wepublish/payments'

export interface ExampleURLAdapterProps {
  websiteURL: string
}

class ExampleURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: ExampleURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/a/${article.id}/${article.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/p/${peer.id}/${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug || author.id}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment, peer?: Peer) {
    if (comment.itemType === CommentItemType.article) {
      return `${this.websiteURL}/a/${item.id}/${item.slug}#${comment.id}`
    }

    if (comment.itemType === CommentItemType.peerArticle) {
      return `${this.websiteURL}/p/${peer?.id}/${item.id}#${comment.id}`
    }

    return `${this.websiteURL}/${item.slug}#${comment.id}`
  }

  getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/${token}`
  }

  getLoginURL(token: string): string {
    return `${this.websiteURL}/login?jwt=${token}`
  }
}

export const initOldContextForTest = async (prisma: PrismaClient) => {
  const mediaAdapter = new KarmaMediaAdapter(new URL('https://meida.test.wepublish.com'), 'token')
  const mailProvider = new MailchimpMailProvider({
    id: 'mailchimp',
    name: 'Mailchimp',
    fromAddress: 'dev@wepublish.ch',
    webhookEndpointSecret: 'secret',
    apiKey: 'key',
    baseURL: '',
    incomingRequestHandler: bodyParser.urlencoded({extended: true})
  })

  const paymentProviders: PaymentProvider[] = []

  paymentProviders.push(
    new StripeCheckoutPaymentProvider({
      id: 'stripe_checkout',
      name: 'Stripe Checkout',
      offSessionPayments: false,
      secretKey: 'key',
      webhookEndpointSecret: 'secret',
      incomingRequestHandler: bodyParser.raw({type: 'application/json'})
    }),
    new StripePaymentProvider({
      id: 'stripe',
      name: 'Stripe',
      offSessionPayments: true,
      secretKey: 'key',
      webhookEndpointSecret: 'secret',
      incomingRequestHandler: bodyParser.raw({type: 'application/json'})
    }),
    new PayrexxPaymentProvider({
      id: 'payrexx',
      name: 'Payrexx',
      offSessionPayments: false,
      instanceName: 'instanceName',
      instanceAPISecret: 'secret',
      psp: [0, 15, 17, 2, 3, 36],
      pm: [
        'postfinance_card',
        'postfinance_efinance',
        // "mastercard",
        // "visa",
        'twint',
        // "invoice",
        'paypal'
      ],
      vatRate: 7.7,
      incomingRequestHandler: bodyParser.json()
    }),
    new PayrexxSubscriptionPaymentProvider({
      id: 'payrexx-subscription',
      name: 'Payrexx Subscription',
      offSessionPayments: true,
      instanceName: 'instanceName',
      instanceAPISecret: 'secret',
      incomingRequestHandler: bodyParser.json(),
      webhookSecret: 'xxxx',
      prisma
    })
  )

  const challenge = new AlgebraicCaptchaChallenge('changeMe', 600, {
    width: 200,
    height: 200,
    background: '#ffffff',
    noise: 5,
    minValue: 1,
    maxValue: 10,
    operandAmount: 1,
    operandTypes: ['+', '-'],
    mode: 'formula',
    targetSymbol: '?'
  })

  const oauth2Providers: Oauth2Provider[] = []
  oauth2Providers.push({
    name: 'google',
    discoverUrl: 'https://fake-oauth.com',
    clientId: 'clientId',
    clientKey: 'clientKey',
    redirectUri: ['https://fake-oauth.com/redirect'],
    scopes: ['openid profile email']
  })

  global.oldContext = await contextFromRequest(null, {
    hostURL: 'https://api.test.wepublish.com',
    websiteURL: 'https://test.wepublish.com',
    prisma,
    mediaAdapter,
    urlAdapter: new ExampleURLAdapter({websiteURL: 'https://test.wepublish.com'}),
    mailProvider,
    mailContextOptions: {
      defaultFromAddress: process.env.DEFAULT_FROM_ADDRESS ?? 'dev@wepublish.ch',
      defaultReplyToAddress: process.env.DEFAULT_REPLY_TO_ADDRESS ?? 'reply-to@wepublish.ch'
    },
    oauth2Providers,
    paymentProviders,
    challenge
  })
}
