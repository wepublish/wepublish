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

export type NavigationModelEventsEmitter = TypedEmitter<ModelEvents<Navigation>>
export const navigationModelEvents = new EventEmitter() as NavigationModelEventsEmitter

export type PageModelEventEmitter = TypedEmitter<PublishableModelEvents<Page>>
export const pageModelEvents = new EventEmitter() as PageModelEventEmitter

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
  | NavigationModelEventsEmitter
  | PageModelEventEmitter
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
