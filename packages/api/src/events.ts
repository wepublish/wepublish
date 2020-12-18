import {EventEmitter} from 'events'
import TypedEmitter from 'typed-emitter'
import {Context} from './context'
import {User} from './db/user'
import {Article} from './db/article'
import {Peer} from './db/peer'
import {Page} from './db/page'
interface ModelEvents<T> {
  create: (context: Context, model: T) => void
  update: (context: Context, model: T) => void
  delete: (context: Context, id: string) => void
}

interface PublishableModelEvents<T> extends ModelEvents<T> {
  publish: (context: Context, model: T) => void
  unpublish: (context: Context, model: T) => void
}

export type UserModelEventsEmitter = TypedEmitter<ModelEvents<User>>
export const userModelEvents = new EventEmitter() as UserModelEventsEmitter

export type PeerModelEventsEmitter = TypedEmitter<ModelEvents<Peer>>
export const peerModelEvents = new EventEmitter() as PeerModelEventsEmitter

export type ArticleModelEventEmitter = TypedEmitter<PublishableModelEvents<Article>>
export const articleModelEvents = new EventEmitter() as ArticleModelEventEmitter

export type PageModelEventEmitter = TypedEmitter<PublishableModelEvents<Page>>
export const pageModelEvents = new EventEmitter() as PageModelEventEmitter

export type EventsEmitter =
  | UserModelEventsEmitter
  | PeerModelEventsEmitter
  | ArticleModelEventEmitter
  | PageModelEventEmitter

userModelEvents.on('create', (context, model) => {
  setImmediate(async () => {
    await context.dbAdapter.userRole.createUserRole({
      input: {
        name: `${model.name}-Role`,
        description: `UserRole for ${model.name}`,
        permissionIDs: []
      }
    })
  })
})

articleModelEvents.on('publish', (context, model) => {
  setImmediate(() => {
    console.log(`Published Article ${model.published?.title}`)
  })
})
