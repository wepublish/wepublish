import {
  DBImageAdapter,
  CreateImageArgs,
  OptionalImage,
  UpdateImageArgs,
  DeleteImageArgs,
  Image,
  ConnectionResult,
  GetImagesArgs,
  InputCursorType,
  LimitType,
  SortOrder,
  ImageSort
} from '@dev7ch/wepublish-api'

import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'

import {CollectionName, DBImage} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'

export class MongoDBImageAdapter implements DBImageAdapter {
  private images: Collection<DBImage>
  private locale: string

  constructor(db: Db, locale: string) {
    this.images = db.collection(CollectionName.Images)
    this.locale = locale
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
      author: input.author,
      source: input.source,
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
            author: input.author,
            source: input.source,
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

  async getImagesByID(ids: readonly string[]): Promise<OptionalImage[]> {
    const images = await this.images.find({_id: {$in: ids}}).toArray()
    const imageMap = Object.fromEntries(
      images.map(({_id: id, ...article}) => [id, {id, ...article}])
    )

    return ids.map(id => imageMap[id] ?? null)
  }

  async getImages({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetImagesArgs): Promise<ConnectionResult<Image>> {
    const limitCount = Math.min(limit.count, MaxResultsPerPage)
    const sortDirection = limit.type === LimitType.First ? order : -order

    const cursorData = cursor.type !== InputCursorType.None ? Cursor.from(cursor.data) : undefined

    const expr =
      order === SortOrder.Ascending
        ? cursor.type === InputCursorType.After
          ? '$gt'
          : '$lt'
        : cursor.type === InputCursorType.After
        ? '$lt'
        : '$gt'

    const sortField = imageSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    let textFilter: FilterQuery<any> = {}
    let metaFilters: FilterQuery<any> = []

    // TODO: Rename to search
    if (filter?.title != undefined) {
      textFilter['$or'] = [
        {title: {$regex: filter.title, $options: 'i'}},
        {filename: {$regex: filter.title, $options: 'i'}}
      ]
    }

    if (filter?.tags) {
      metaFilters.push({tags: {$in: filter.tags}})
    }
    const [totalCount, images] = await Promise.all([
      this.images.countDocuments(
        {$and: [metaFilters.length ? {$and: metaFilters} : {}, textFilter]} as any,
        {collation: {locale: this.locale, strength: 2}} as MongoCountPreferences
      ), // MongoCountPreferences doesn't include collation

      this.images
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(metaFilters.length ? {$and: metaFilters} : {})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = images.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? images.length > limitCount
        : cursor.type === InputCursorType.Before
        ? true
        : false

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? images.length > limitCount
        : cursor.type === InputCursorType.After
        ? true
        : false

    const firstImage = nodes[0]
    const lastImage = nodes[nodes.length - 1]

    const startCursor = firstImage
      ? new Cursor(firstImage._id, imageDateForSort(firstImage, sort)).toString()
      : null

    const endCursor = lastImage
      ? new Cursor(lastImage._id, imageDateForSort(lastImage, sort)).toString()
      : null

    return {
      nodes: nodes.map<Image>(({_id: id, ...image}) => ({id, ...image})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }
}

function imageSortFieldForSort(sort: ImageSort) {
  switch (sort) {
    case ImageSort.CreatedAt:
      return 'createdAt'

    case ImageSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function imageDateForSort(image: DBImage, sort: ImageSort): Date {
  switch (sort) {
    case ImageSort.CreatedAt:
      return image.createdAt

    case ImageSort.ModifiedAt:
      return image.modifiedAt
  }
}
