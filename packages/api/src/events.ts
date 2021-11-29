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
  if (model.paidAt !== null && model.userID) {
    const user = await context.dbAdapter.user.getUserByID(model.userID)
    if (!user || !user.subscription) return
    const {periods} = user.subscription
    const period = periods.find(period => period.invoiceID === model.id)
    if (!period) return
    if (user.subscription.paidUntil === null || period.endsAt > user.subscription.paidUntil) {
      await context.dbAdapter.user.updateUserSubscription({
        userID: user.id,
        input: {
          ...user.subscription,
          paidUntil: period.endsAt
        }
      })

      if (!user.active && user.lastLogin === null) {
        await context.dbAdapter.user.updateUser({
          id: user.id,
          input: {
            ...user,
            active: true
          }
        })
        // Send FirstTime Hello
        const token = context.generateJWT({
          id: user.id,
          expiresInMinutes: 60 * 24
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
