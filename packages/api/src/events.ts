import {EventEmitter} from 'events'
import TypedEmitter from 'typed-emitter'
import {Context} from './context'
import {User} from './db/user'
import {Article} from './db/article'
import {Peer} from './db/peer'
import {Page} from './db/page'
import {Author} from './db/author'
import {Image} from './db/image'
import {Navigation} from './db/navigation'
import {UserRole} from './db/userRole'
import {Invoice} from './db/invoice'
import {MailLog} from './db/mailLog'
import {MemberPlan} from './db/memberPlan'
import {Payment} from './db/payment'
import {PaymentMethod} from './db/paymentMethod'
import {SendMailType} from './mails/mailContext'
import {logger} from './server'
import crypto from 'crypto'
import {Subscription} from './db/subscription'
interface ModelEvents<T> {
  create: (context: Context, model: T) => void
  update: (context: Context, model: T) => void
  delete: (context: Context, id: string) => void
}

interface PublishableModelEvents<T> extends ModelEvents<T> {
  publish: (context: Context, model: T) => void
  unpublish: (context: Context, model: T) => void
}
export type ArticleModelEventEmitter = TypedEmitter<PublishableModelEvents<Article>>
export const articleModelEvents = new EventEmitter() as ArticleModelEventEmitter

export type AuthorModelEventsEmitter = TypedEmitter<ModelEvents<Author>>
export const authorModelEvents = new EventEmitter() as AuthorModelEventsEmitter

export type ImageModelEventsEmitter = TypedEmitter<ModelEvents<Image>>
export const imageModelEvents = new EventEmitter() as ImageModelEventsEmitter

export type InvoiceModelEventsEmitter = TypedEmitter<ModelEvents<Invoice>>
export const invoiceModelEvents = new EventEmitter() as InvoiceModelEventsEmitter

export type MailLogModelEventsEmitter = TypedEmitter<ModelEvents<MailLog>>
export const mailLogModelEvents = new EventEmitter() as MailLogModelEventsEmitter

export type MemberPlanModelEventsEmitter = TypedEmitter<ModelEvents<MemberPlan>>
export const memberPlanModelEvents = new EventEmitter() as MemberPlanModelEventsEmitter

export type NavigationModelEventsEmitter = TypedEmitter<ModelEvents<Navigation>>
export const navigationModelEvents = new EventEmitter() as NavigationModelEventsEmitter

export type PageModelEventEmitter = TypedEmitter<PublishableModelEvents<Page>>
export const pageModelEvents = new EventEmitter() as PageModelEventEmitter

export type PaymentModelEventEmitter = TypedEmitter<ModelEvents<Payment>>
export const paymentModelEvents = new EventEmitter() as PaymentModelEventEmitter

export type PaymentMethodModelEventEmitter = TypedEmitter<ModelEvents<PaymentMethod>>
export const paymentMethodModelEvents = new EventEmitter() as PaymentMethodModelEventEmitter

export type PeerModelEventsEmitter = TypedEmitter<ModelEvents<Peer>>
export const peerModelEvents = new EventEmitter() as PeerModelEventsEmitter

export type SubscriptionModelEventsEmitter = TypedEmitter<ModelEvents<Subscription>>
export const subscriptionModelEvents = new EventEmitter() as SubscriptionModelEventsEmitter

export type UserModelEventsEmitter = TypedEmitter<ModelEvents<User>>
export const userModelEvents = new EventEmitter() as UserModelEventsEmitter

export type UserRoleModelEventsEmitter = TypedEmitter<ModelEvents<UserRole>>
export const userRoleModelEvents = new EventEmitter() as UserRoleModelEventsEmitter

export type EventsEmitter =
  | ArticleModelEventEmitter
  | AuthorModelEventsEmitter
  | ImageModelEventsEmitter
  | InvoiceModelEventsEmitter
  | MailLogModelEventsEmitter
  | MemberPlanModelEventsEmitter
  | NavigationModelEventsEmitter
  | PageModelEventEmitter
  | PaymentModelEventEmitter
  | PaymentMethodModelEventEmitter
  | PeerModelEventsEmitter
  | SubscriptionModelEventsEmitter
  | UserModelEventsEmitter
  | UserRoleModelEventsEmitter

type NormalProxyMethods = 'create' | 'update' | 'delete'
type PublishableProxyMethods = NormalProxyMethods | 'publish' | 'unpublish'

interface MethodsToProxy {
  key: string
  methods: (NormalProxyMethods | PublishableProxyMethods)[]
  eventEmitter: EventsEmitter
}

export const methodsToProxy: MethodsToProxy[] = [
  {
    key: 'article',
    methods: ['create', 'update', 'delete', 'publish', 'unpublish'],
    eventEmitter: articleModelEvents
  },
  {
    key: 'author',
    methods: ['create', 'update', 'delete'],
    eventEmitter: authorModelEvents
  },
  {
    key: 'image',
    methods: ['create', 'update', 'delete'],
    eventEmitter: imageModelEvents
  },
  {
    key: 'invoice',
    methods: ['create', 'update', 'delete'],
    eventEmitter: invoiceModelEvents
  },
  {
    key: 'mailLog',
    methods: ['create', 'update', 'delete'],
    eventEmitter: mailLogModelEvents
  },
  {
    key: 'memberPlan',
    methods: ['create', 'update', 'delete'],
    eventEmitter: memberPlanModelEvents
  },
  {
    key: 'navigation',
    methods: ['create', 'update', 'delete'],
    eventEmitter: navigationModelEvents
  },
  {
    key: 'page',
    methods: ['create', 'update', 'delete', 'publish', 'unpublish'],
    eventEmitter: pageModelEvents
  },
  {
    key: 'payment',
    methods: ['create', 'update', 'delete'],
    eventEmitter: paymentModelEvents
  },
  {
    key: 'paymentMethod',
    methods: ['create', 'update', 'delete'],
    eventEmitter: paymentMethodModelEvents
  },
  {
    key: 'peer',
    methods: ['create', 'update', 'delete'],
    eventEmitter: peerModelEvents
  },
  {
    key: 'subscription',
    methods: ['create', 'update', 'delete'],
    eventEmitter: subscriptionModelEvents
  },
  {
    key: 'user',
    methods: ['create', 'update', 'delete'],
    eventEmitter: userModelEvents
  },
  {
    key: 'userRole',
    methods: ['create', 'update', 'delete'],
    eventEmitter: userRoleModelEvents
  }
]

// this is an example on how to react to events. Not yet sure where that logic should go
userModelEvents.on('create', (context, model) => {
  console.log(`User ${model.name} created`)
})

invoiceModelEvents.on('update', async (context, model) => {
  // TODO: rethink this logic
  if (model.paidAt !== null && model.subscriptionID) {
    const subscription = await context.dbAdapter.subscription.getSubscriptionByID(
      model.subscriptionID
    )
    if (!subscription) return
    const {periods} = subscription
    const period = periods.find(period => period.invoiceID === model.id)
    if (!period) return
    if (subscription.paidUntil === null || period.endsAt > subscription.paidUntil) {
      const updatedSubscription = await context.dbAdapter.subscription.updateSubscription({
        id: subscription.id,
        input: {
          ...subscription,
          paidUntil: period.endsAt
        }
      })

      if (!updatedSubscription) {
        logger('events').warn(`Could not update Subscription %s`, subscription.id)
        return
      }

      if (subscription.userID.startsWith('__temp')) {
        const tempUser = await context.dbAdapter.tempUser.getTempUserByID(subscription.userID)
        if (!tempUser) return

        const user = await context.dbAdapter.user.createUser({
          input: {
            email: tempUser.email,
            name: tempUser.name,
            address: tempUser.address,
            preferredName: tempUser.preferredName,
            active: true,
            roleIDs: [],
            properties: [],
            emailVerifiedAt: null
          },
          password: crypto.randomBytes(48).toString('hex')
        })

        if (!user) {
          logger('events').error(`Could not create user from tempUser %s`, tempUser.id)
          return
        }

        const deletedTempUser = await context.dbAdapter.tempUser.deleteTempUser({
          id: tempUser.id
        })

        if (!deletedTempUser) {
          logger('events').error(`Could not delete tempUser %s`, tempUser.id)
        }

        const updatedSubscription = await context.dbAdapter.subscription.updateSubscription({
          id: subscription.id,
          input: {
            ...subscription,
            userID: user.id
          }
        })

        if (!updatedSubscription) {
          logger('events').error(`Could not update subscription %s`, subscription.id)
          return
        }

        const token = context.generateJWT({
          id: user.id,
          expiresInMinutes: parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
        })
        await context.mailContext.sendMail({
          type: SendMailType.NewMemberSubscription,
          recipient: user.email,
          data: {
            url: context.urlAdapter.getLoginURL(token),
            user
          }
        })
      } else {
        const user = await context.dbAdapter.user.getUserByID(subscription.userID)
        if (!user) {
          logger('events').warn(`User not found %s`, subscription.userID)
          return
        }

        await context.mailContext.sendMail({
          type: SendMailType.RenewedMemberSubscription,
          recipient: user.email,
          data: {
            user
          }
        })
      }
    }
  }
})
