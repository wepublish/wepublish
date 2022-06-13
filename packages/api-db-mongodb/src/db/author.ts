import {DBAuthorAdapter, OptionalAuthor, UpdateAuthorArgs} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBAuthor} from './schema'

export class MongoDBAuthorAdapter implements DBAuthorAdapter {
  private authors: Collection<DBAuthor>

  constructor(db: Db) {
    this.authors = db.collection(CollectionName.Authors)
  }

  async updateAuthor({id, input}: UpdateAuthorArgs): Promise<OptionalAuthor> {
    const {value} = await this.authors.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          slug: input.slug,
          jobTitle: input.jobTitle,
          imageID: input.imageID,
          links: input.links,
          bio: input.bio
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...author} = value
    return {id: outID, ...author}
  }
}
