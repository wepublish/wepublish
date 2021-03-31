import {Context} from '../context'
import {Content, DBContentState} from '../db/content'
import nanoid from 'nanoid/generate'
import {
  authorise,
  CanCreateArticle,
  CanDeleteArticle,
  CanPublishArticle
} from '../graphql/permissions'
import {ContentModelSchemas, ContentModelSchemaTypes} from '../interfaces/contentModelSchema'
import {MapType} from '../interfaces/utilTypes'
import {MediaReferenceType, Reference} from '../interfaces/referenceType'

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

    const schema = this.context.contentModels.find(item => item.identifier === identifier)
    if (!schema) {
      throw Error(`Schema ${identifier} not found`)
    }
    await validateInput({context: this.context}, schema.schema.content, input.content)
    await validateInput({context: this.context}, schema.schema.meta, input.meta)

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

    const schema = this.context.contentModels.find(item => item.identifier === identifier)
    if (!schema) {
      throw Error(`Schema ${identifier} not found`)
    }
    await validateInput({context: this.context}, schema.schema.content, input.content)
    await validateInput({context: this.context}, schema.schema.meta, input.meta)

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

interface ValidatorContext {
  context: Omit<Context, 'business'>
}
async function validateInput(
  validatorContext: ValidatorContext,
  schema?: MapType<ContentModelSchemas>,
  data?: MapType<any>
) {
  if (!(data && schema)) return
  for (const [key, val] of Object.entries(schema)) {
    await validateRecursive(validatorContext, val, data[key])
  }
}

async function validateRecursive(
  validatorContext: ValidatorContext,
  schema: ContentModelSchemas,
  data: unknown
) {
  switch (schema.type) {
    case ContentModelSchemaTypes.object:
      const obj = data as MapType<any>
      for (let [key, val] of Object.entries(obj)) {
        await validateRecursive(validatorContext, schema.fields[key], val)
      }
      break

    case ContentModelSchemaTypes.list:
      const list = data as unknown[]
      for (const item of list) {
        await validateRecursive(validatorContext, schema.contentType, item)
      }
      break

    case ContentModelSchemaTypes.union:
      const union = data as MapType<any>
      const {unionCase, val} = destructUnionCase(union)
      await validateRecursive(validatorContext, schema.cases[unionCase], val)
      break

    case ContentModelSchemaTypes.reference:
      const ref = data as Reference
      if (ref?.recordId) {
        let record
        try {
          if (ref.contentType === MediaReferenceType) {
            const image = await validatorContext.context.loaders.images.load(ref.recordId)
            if (Object.keys(schema.types).some(type => type === MediaReferenceType)) {
              record = image
            }
          } else {
            const content = await validatorContext.context.loaders.content.load(ref.recordId)
            if (Object.keys(schema.types).some(type => type === content?.contentType)) {
              record = content
            }
          }
        } catch (error) {}
        if (!record) {
          throw new Error(`Reference of type ${ref.contentType} and id ${ref.recordId} not valid`)
        }

        delete ref.record
        delete ref.peer
      }

      break

    default:
      break
  }
}

function destructUnionCase(value: any) {
  const unionCase = Object.keys(value)[0]
  return {
    unionCase,
    val: value[unionCase]
  }
}
