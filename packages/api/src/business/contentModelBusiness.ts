import {Context} from '../context'
import {Content, DBContentState} from '../db/content'
import nanoid from 'nanoid/generate'
import {
  authorise,
  CanCreateArticle,
  CanDeleteArticle,
  CanPublishArticle
} from '../graphql/permissions'

export function generateID() {
  return nanoid('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16)
}

export class BusinessLogic {
  private context: Omit<Context, 'business'>

  constructor(context: Omit<Context, 'business'>) {
    this.context = context
  }

  async createContent(identifier: string, input: Content) {
    const {roles} = this.context.authenticate()
    authorise(CanCreateArticle, roles)

    return this.context.dbAdapter.content.createContent({
      input: {
        ...input,
        id: generateID(),
        contentType: identifier,
        revision: 1,
        state: DBContentState.Draft,
        createdAt: new Date(),
        modifiedAt: new Date(),
        publicationDate: undefined,
        dePublicationDate: undefined
      }
    })
  }

  async updateContent(identifier: string, input: Content) {
    const {roles} = this.context.authenticate()
    authorise(CanCreateArticle, roles)

    return this.context.dbAdapter.content.updateContent({
      input: {
        ...input,
        contentType: identifier,
        revision: 1,
        state: DBContentState.Draft,
        modifiedAt: new Date()
      }
    })
  }

  async deleteContent(id: string) {
    const {roles} = this.context.authenticate()
    authorise(CanDeleteArticle, roles)
    return this.context.dbAdapter.content.deleteContent({id})
  }

  async publishContent(
    id: string,
    revision: number,
    publishAt: Date,
    publishedAt: Date,
    updatedAt?: Date
  ) {
    const {roles} = this.context.authenticate()
    authorise(CanPublishArticle, roles)

    return this.context.dbAdapter.content.updateContent({
      input: {
        id,
        revision,
        state: DBContentState.Release,
        modifiedAt: updatedAt || new Date(),
        publicationDate: publishAt || new Date()
      }
    })
  }

  async unpublishContent(id: string, revision: number) {
    const {roles} = this.context.authenticate()
    authorise(CanPublishArticle, roles)

    return this.context.dbAdapter.content.updateContent({
      input: {
        id,
        revision,
        state: DBContentState.Draft,
        modifiedAt: new Date()
      }
    })
  }
}
