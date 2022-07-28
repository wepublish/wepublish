import {
  DBPageAdapter,
  OptionalPage,
  PublishPageArgs,
  UnpublishPageArgs,
  UpdatePageArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBPage} from './schema'

export class MongoDBPageAdapter implements DBPageAdapter {
  private pages: Collection<DBPage>

  constructor(db: Db) {
    this.pages = db.collection(CollectionName.Pages)
  }

  async updatePage({id, input}: UpdatePageArgs): Promise<OptionalPage> {
    const {...data} = input
    const {value} = await this.pages.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            modifiedAt: new Date(),

            'draft.revision': {
              $ifNull: [
                '$draft.revision',
                {
                  $cond: [
                    {$ne: ['$pending', null]},
                    {$add: ['$pending.revision', 1]},
                    {
                      $cond: [{$ne: ['$published', null]}, {$add: ['$published.revision', 1]}, 0]
                    }
                  ]
                }
              ]
            },

            'draft.createdAt': {
              $ifNull: ['$draft.createdAt', new Date()]
            },

            'draft.slug': data.slug,

            'draft.title': data.title,
            'draft.description': data.description,

            'draft.imageID': data.imageID,
            'draft.tags': data.tags,

            'draft.socialMediaTitle': data.socialMediaTitle,
            'draft.socialMediaDescription': data.socialMediaDescription,
            'draft.socialMediaImageID': data.socialMediaImageID,

            'draft.properties': data.properties,

            'draft.blocks': data.blocks
          }
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...page} = value
    return {id: outID, ...page}
  }

  async publishPage({
    id,
    publishAt,
    publishedAt,
    updatedAt
  }: PublishPageArgs): Promise<OptionalPage> {
    publishAt = publishAt ?? new Date()

    if (publishAt > new Date()) {
      const {value} = await this.pages.findOneAndUpdate(
        {_id: id},
        [
          {
            $set: {
              modifiedAt: new Date(),
              pending: {
                $cond: [
                  {$ne: ['$draft', null]},
                  '$draft',
                  {
                    $cond: [
                      {$ne: ['$pending', null]},
                      '$pending',
                      {$cond: [{$ne: ['$published', null]}, '$published', null]}
                    ]
                  }
                ]
              },
              draft: null
            }
          },
          {
            $set: {
              'pending.publishAt': publishAt,
              'pending.publishedAt': publishedAt ?? {
                $cond: [{$ne: ['$published', null]}, '$published.publishedAt', publishAt]
              },

              'pending.updatedAt': updatedAt ?? publishAt
            }
          }
        ] as any,
        {returnOriginal: false}
      )

      if (!value) return null

      const {_id: outID, ...page} = value
      return {id: outID, ...page}
    } else {
      const {value} = await this.pages.findOneAndUpdate(
        {_id: id},
        [
          {
            $set: {
              tempPublishedAt: '$published.publishedAt'
            }
          },
          {
            $set: {
              published: {
                $ifNull: ['$draft', {$ifNull: ['$pending', '$published']}]
              },
              pending: null,
              draft: null
            }
          },
          {
            $set: {
              'published.publishedAt': publishedAt ?? {
                $ifNull: ['$tempPublishedAt', publishAt]
              },

              'published.updatedAt': updatedAt ?? publishAt
            }
          },
          {
            $unset: ['tempPublishedAt', 'published.publishAt']
          }
        ] as any,
        {returnOriginal: false}
      )

      if (!value) return null

      const {_id: outID, ...page} = value
      return {id: outID, ...page}
    }
  }

  async unpublishPage({id}: UnpublishPageArgs): Promise<OptionalPage> {
    const {value} = await this.pages.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            draft: {
              $ifNull: ['$draft', {$ifNull: ['$pending', '$published']}]
            },
            pending: null,
            published: null
          }
        },
        {
          $unset: ['draft.publishAt', 'draft.publishedAt', 'draft.updatedAt']
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...page} = value
    return {id: outID, ...page}
  }
}
