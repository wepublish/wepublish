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
import {Subscription} from './db/subscription'
import {isTempUser, removePrefixTempUser} from './utility'

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
  // only activate subscription, if invoice has a paidAt and subscriptionID
  if (!model.paidAt || !model.subscriptionID) {
    return
  }
  let mailTypeToSend = SendMailType.NewMemberSubscription
  let subscription = await context.dbAdapter.subscription.getSubscriptionByID(model.subscriptionID)
  if (!subscription) return
  const {periods} = subscription
  const period = periods.find(period => period.invoiceID === model.id)
  if (!period) return

  if (subscription.paidUntil === null || period.endsAt > subscription.paidUntil) {
    subscription = await context.dbAdapter.subscription.updateSubscription({
      id: subscription.id,
      input: {
        ...subscription,
        paidUntil: period.endsAt
      }
    })
    if (!subscription) {
      logger('events').warn(`Could not update Subscription.`)
      return
    }

    // eventually activate temp user and send mails for new users
    if (isTempUser(subscription.userID)) {
      const tempUser = await context.dbAdapter.tempUser.getTempUserByID(
        removePrefixTempUser(subscription.userID)
      )
      if (!tempUser) {
        logger('events').warn(`Could not find temp user with id ${subscription.userID}`)
        return
      }
      subscription = await context.memberContext.activateTempUser(
        context.dbAdapter,
        tempUser.id,
        subscription
      )
      if (!subscription) {
        logger('events').warn(
          `Subscription of temp user with ID ${tempUser.id} after activate temp user not found.`
        )
        return
      }
    }

    // in case of multiple periods we need to send a renewal member subscription instead of the default new memeber subscription mail
    if (periods.length > 1) {
      mailTypeToSend = SendMailType.RenewedMemberSubscription
    }

    // mail sending depending
    const user = await context.dbAdapter.user.getUserByID(subscription.userID)
    if (!user) {
      logger('events').warn(`User not found %s`, subscription.userID)
      return
    }
    const token = context.generateJWT({
      id: user.id,
      expiresInMinutes: parseInt(process.env.SEND_LOGIN_JWT_EXPIRES_MIN as string)
    })
    await context.mailContext.sendMail({
      type: mailTypeToSend,
      recipient: user.email,
      data: {
        url: context.urlAdapter.getLoginURL(token),
        user,
        subscription
      }
    })
  }
})
