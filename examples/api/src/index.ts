#!/usr/bin/env node
import {
  Author,
  MailgunMailProvider,
  Oauth2Provider,
  PaymentPeriodicity,
  PayrexxPaymentProvider,
  PublicArticle,
  PublicPage,
  StripeCheckoutPaymentProvider,
  StripePaymentProvider,
  URLAdapter,
  WepublishServer
} from "@wepublish/api";

import { KarmaMediaAdapter } from "@wepublish/api-media-karma";
import { MongoDBAdapter } from "@wepublish/api-db-mongodb";

import { URL } from "url";
import { SlackMailProvider } from "./SlackMailProvider";
import bodyParser from "body-parser";
import yargs from "yargs";
// @ts-ignore
import { hideBin } from "yargs/helpers";
import { JobType } from "@wepublish/api/lib/jobs";
// @ts-ignore
import csvdb from "node-csv-query";
import neatCsv from "neat-csv";
import path from "path";
import * as fs from "fs";

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

  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error('No STRIPE_SECRET_KEY defined in environment.')
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    throw new Error('No STRIPE_WEBHOOK_SECRET defined in environment')
  if (!process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET)
    throw new Error('No STRIPE_CHECKOUT_WEBHOOK_SECRET defined in environment')

  if (!process.env.PAYREXX_INSTANCE_NAME)
    throw new Error('No PAYREXX_INSTANCE_NAME defined in environment')
  if (!process.env.PAYREXX_API_SECRET)
    throw new Error('No PAYREXX_API_SECRET defined in environment')

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
      apiKey: process.env.MAILGUN_API_KEY,
      incomingRequestHandler: bodyParser.json()
    })
  }
  // left here intentionally for testing
  /* if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_WEBHOOK_SECRET) {
    mailProvider = new MailchimpMailProvider({
      id: 'mailchimp',
      name: 'Mailchimp',
      fromAddress: 'dev@wepublish.ch',
      webhookEndpointSecret: process.env.MAILCHIMP_WEBHOOK_SECRET,
      apiKey: process.env.MAILCHIMP_API_KEY,
      baseURL: '',
      incomingRequestHandler: bodyParser.urlencoded({extended: true})
    })
  } */

  if (process.env.SLACK_DEV_MAIL_WEBHOOK_URL) {
    mailProvider = new SlackMailProvider({
      id: 'slackMail',
      name: 'Slack Mail',
      fromAddress: 'fakeMail@wepublish.media',
      webhookURL: process.env.SLACK_DEV_MAIL_WEBHOOK_URL
    })
  }

  const paymentProviders = [
    new StripeCheckoutPaymentProvider({
      id: 'stripe_checkout',
      name: 'Stripe Checkout',
      offSessionPayments: false,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookEndpointSecret: process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET,
      incomingRequestHandler: bodyParser.raw({type: 'application/json'})
    }),
    new StripePaymentProvider({
      id: 'stripe',
      name: 'Stripe',
      offSessionPayments: true,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
      incomingRequestHandler: bodyParser.raw({type: 'application/json'})
    }),
    new PayrexxPaymentProvider({
      id: 'payrexx',
      name: 'Payrexx',
      offSessionPayments: false,
      instanceName: process.env.PAYREXX_INSTANCE_NAME,
      instanceAPISecret: process.env.PAYREXX_API_SECRET,
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
    })
  ]

  const server = new WepublishServer({
    hostURL,
    websiteURL,
    mediaAdapter,
    dbAdapter,
    oauth2Providers,
    mailProvider,
    paymentProviders,
    urlAdapter: new ExampleURLAdapter({websiteURL}),
    playground: true,
    introspection: true,
    tracing: true
  })

  // eslint-disable-next-line no-unused-expressions
  yargs(hideBin(process.argv))
    .command(
      ['listen', '$0'],
      'start the server',
      () => {},
      async argv => {
        await server.listen(port, address)
      }
    )
    .command(
      'sendTestMail [recipient]',
      'send a test mail',
      yargs => {
        yargs.positional('recipient', {
          type: 'string',
          default: 'dev@wepublish.ch',
          describe: 'recipient of the test mail'
        })
      },
      async argv => {
        await server.runJob(JobType.SendTestMail, {
          subject: 'This is a test mail from a we.publish instance',
          recipient: argv.recipient,
          message: 'Hello from the other side',
          replyToAddress: 'dev@wepublish.ch'
        })
        process.exit(0)
      }
    )
    .command(
      'dmr',
      'Renew Memberships',
      () => {},
      async argv => {
        await server.runJob(JobType.DailyMembershipRenewal, {
          startDate: new Date()
        })
        console.log(`Sent test mail to ${argv.recipient}`)
        process.exit(0)
      }
    )
    .command(
      'import',
      'import subscriptions',
      () => {},
      async (argv) => {
        console.log(`Starting IMport`)
        const filePath = path.join(__dirname, '../users.csv');
        fs.readFile(filePath, async (error, data) => {
          if (error) {
            return console.log('error reading file', error);
          }

          const users = await neatCsv(data)
          const periodsDb = await csvdb(`${__dirname}/../periods.csv`)
          const lineDb = await csvdb(`${__dirname}/../lineitems.csv`)

          for (const user of users) {
            console.log(`Importing User ${user.name} with ID ${user.id}`)
            if(!user.subscription_id) {
              console.warn(`User ${user.id} does not have a subscription`)
              continue
            }
            const periodsLine = []
            const periods = await periodsDb.find({subscription_id: user.subscription_id})
            for (const period of periods) {
              const lineItem = await lineDb.findOne({id: period.line_item_id})
              const dateStart = new Date(period.starts_on)
              const dateEnd = new Date(period.ends_on)
              const difference = dateEnd.getTime() - dateStart.getTime()
              const differenceInDays = difference / (1000 * 3600 * 24)
              let periodicity = ''
              if(differenceInDays < 80) {
                periodicity = PaymentPeriodicity.Monthly
              } else if(differenceInDays < 300) {
                periodicity = PaymentPeriodicity.Quarterly
              } else {
                periodicity = PaymentPeriodicity.Yearly
              }
              periodsLine.push({
                ...period,
                periodicity,
                lineItem
              })
            }

            const newUser = await dbAdapter.user.createUser({
              input: {
                email: user.email,
                name: user.full_name,
                roleIDs: []
              },
              password: 'randomTestPasswor'
            })

            if(!newUser) {
              console.log('Could not create user', user)
              continue
            }

            let paymentPeriodicity: PaymentPeriodicity = PaymentPeriodicity.Monthly
            let monthlyAmount = 5
            switch(user.subscription_periodicity) {
              case 'jährlich':
                paymentPeriodicity = PaymentPeriodicity.Yearly
                monthlyAmount = Math.floor(parseInt(user.subscription_amount) / 12)
                break
              case 'vierteljährlich':
                paymentPeriodicity = PaymentPeriodicity.Quarterly
                monthlyAmount = Math.floor(parseInt(user.subscription_amount) / 3)
                break
              case 'monatlich':
                paymentPeriodicity = PaymentPeriodicity.Monthly
                monthlyAmount = parseInt(user.subscription_amount)
            }

            const subscription = await dbAdapter.user.updateUserSubscription({
              userId: newUser.id,
              input: {
                payedUntil: user.subscription_paid_until ? new Date(user.subscription_paid_until) : null,
                autoRenew: user.subscription_renew_automatically === '1',
                memberPlanID: 'HVYylbcT3lTfvCDi',
                deactivatedAt: user.subscription_ends_on === '-' ? null :  new Date(user.subscription_ends_on),
                paymentPeriodicity,
                monthlyAmount,
                paymentMethodID: 'dxah6HJc2NNIZUyZ',
                startsAt: new Date(user.subscription_starts_on)
              }
            })

            for (const period of periodsLine) {
              const invoice = await dbAdapter.invoice.createInvoice({
                input: {
                  payedAt: period?.lineItem?.created_at ? new Date(period?.lineItem?.created_at) : new Date(),
                  items: [{
                    name: period?.lineItem?.title ?? 'N/A',
                    quantity: 1,
                    amount: parseInt(period?.lineItem?.amount),
                    createdAt: new Date(period?.lineItem?.created_at),
                    modifiedAt: new Date(period?.lineItem?.created_at),
                  }],
                  mail: newUser.email,
                  userID: newUser.id
                }
              })

              await dbAdapter.user.addUserSubscriptionPeriod({
                userID: newUser.id,
                input: {
                  invoiceID: invoice.id,
                  startsAt: new Date(period.starts_on),
                  endsAt: new Date(period.ends_on),
                  paymentPeriodicity: period.periodicity as PaymentPeriodicity,
                  amount: parseInt(period.lineItem?.amount)
                }
              })
            }

            console.log('subscription', subscription)
          }
          process.exit(0)
        })
      }
    )
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    }).argv
}

asyncMain().catch(err => {
  console.error(err)
  process.exit(1)
})
