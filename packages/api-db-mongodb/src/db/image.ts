import {
  CreateImageArgs,
  DBImageAdapter,
  DeleteImageArgs,
  OptionalImage,
  UpdateImageArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBImage} from './schema'

export class MongoDBImageAdapter implements DBImageAdapter {
  private images: Collection<DBImage>

  constructor(db: Db) {
    this.images = db.collection(CollectionName.Images)
  }

  async createImage({id, input}: CreateImageArgs): Promise<OptionalImage> {
    const {ops} = await this.images.insertOne({
      _id: id,
      createdAt: new Date(),
      modifiedAt: new Date(),

      fileSize: input.fileSize,
      extension: input.extension,
      mimeType: input.mimeType,
      format: input.format,
      width: input.width,
      height: input.height,

      filename: input.filename,
      title: input.title,
      description: input.description,
      tags: input.tags,
      source: input.source,
      link: input.link,
      license: input.license,
      focalPoint: input.focalPoint
    })

    const {_id: outID, ...image} = ops[0]
    return {id: outID, ...image}
  }

  async updateImage({id, input}: UpdateImageArgs): Promise<OptionalImage> {
    const {value} = await this.images.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            modifiedAt: new Date(),
            filename: input.filename,
            title: input.title,
            description: input.description,
            tags: input.tags,
            source: input.source,
            link: input.link,
            license: input.license,
            focalPoint: input.focalPoint
          }
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...image} = value
    return {id: outID, ...image}
  }

  async deleteImage({id}: DeleteImageArgs): Promise<boolean | null> {
    const {deletedCount} = await this.images.deleteOne({_id: id})
    return deletedCount !== 0 ? true : null
  }
}
