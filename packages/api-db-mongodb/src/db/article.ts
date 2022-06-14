import {
  DBArticleAdapter,
  OptionalArticle,
  PublishArticleArgs,
  UnpublishArticleArgs,
  UpdateArticleArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBArticle} from './schema'

export class MongoDBArticleAdapter implements DBArticleAdapter {
  private articles: Collection<DBArticle>

  constructor(db: Db) {
    this.articles = db.collection(CollectionName.Articles)
  }

  async updateArticle({id, input}: UpdateArticleArgs): Promise<OptionalArticle> {
    const {shared, ...data} = input

    // TODO: Escape user input with `$literal`, check other adapters aswell.
    const {value} = await this.articles.findOneAndUpdate(
      {_id: id},
      [
        {
          $set: {
            shared,
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

            'draft.title': data.title,
            'draft.preTitle': data.preTitle,
            'draft.lead': data.lead,
            'draft.seoTitle': data.seoTitle,

            'draft.slug': data.slug,
            'draft.imageID': data.imageID,
            'draft.authorIDs': data.authorIDs,
            'draft.tags': data.tags,
            'draft.breaking': data.breaking,

            'draft.properties': data.properties,

            'draft.blocks': data.blocks,

            'draft.hideAuthor': data.hideAuthor,

            'draft.canonicalUrl': data.canonicalUrl,

            'draft.socialMediaTitle': data.socialMediaTitle,
            'draft.socialMediaAuthorIDs': data.socialMediaAuthorIDs,
            'draft.socialMediaDescription': data.socialMediaDescription,
            'draft.socialMediaImageID': data.socialMediaImageID
          }
        }
      ] as any,
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...article} = value
    return {id: outID, ...article}
  }

  async publishArticle({
    id,
    publishAt,
    publishedAt,
    updatedAt
  }: PublishArticleArgs): Promise<OptionalArticle> {
    publishAt = publishAt ?? new Date()

    if (publishAt > new Date()) {
      const {value} = await this.articles.findOneAndUpdate(
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

      const {_id: outID, ...article} = value
      return {id: outID, ...article}
    } else {
      const {value} = await this.articles.findOneAndUpdate(
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

      const {_id: outID, ...article} = value
      return {id: outID, ...article}
    }
  }

  async unpublishArticle({id}: UnpublishArticleArgs): Promise<OptionalArticle> {
    const {value} = await this.articles.findOneAndUpdate(
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

    const {_id: outID, ...article} = value
    return {id: outID, ...article}
  }
}
