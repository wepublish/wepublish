import {DBImageAdapter, OptionalImage, UpdateImageArgs} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBImage} from './schema'

export class MongoDBImageAdapter implements DBImageAdapter {
  private images: Collection<DBImage>

  constructor(db: Db) {
    this.images = db.collection(CollectionName.Images)
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
}
