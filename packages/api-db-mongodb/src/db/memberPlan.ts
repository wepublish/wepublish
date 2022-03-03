import {
  ConnectionResult,
  GetMemberPlansArgs,
  CreateMemberPlanArgs,
  DBMemberPlanAdapter,
  DeleteMemberPlanArgs,
  InputCursorType,
  LimitType,
  MemberPlan,
  MemberPlanSort,
  OptionalMemberPlan,
  SortOrder,
  UpdateMemberPlanArgs
} from '@wepublish/api'
import {Collection, Db, FilterQuery, MongoCountPreferences} from 'mongodb'
import {CollectionName, DBMemberPlan} from './schema'
import {MaxResultsPerPage} from './defaults'
import {Cursor} from './cursor'
import {escapeRegExp} from '../utility'

export class MongoDBMemberPlanAdapter implements DBMemberPlanAdapter {
  private memberPlans: Collection<DBMemberPlan>
  private locale: string

  constructor(db: Db, locale: string) {
    this.memberPlans = db.collection(CollectionName.MemberPlans)
    this.locale = locale
  }

  async createMemberPlan({input}: CreateMemberPlanArgs): Promise<MemberPlan> {
    const {ops} = await this.memberPlans.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      slug: input.slug,
      tags: input.tags,
      imageID: input.imageID,
      description: input.description,
      active: input.active,
      amountPerMonthMin: input.amountPerMonthMin,
      availablePaymentMethods: input.availablePaymentMethods
    })

    const {_id: id, ...memberPlan} = ops[0]
    return {id, ...memberPlan}
  }

  async updateMemberPlan({id, input}: UpdateMemberPlanArgs): Promise<OptionalMemberPlan> {
    const {value} = await this.memberPlans.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          slug: input.slug,
          tags: input.tags,
          imageID: input.imageID,
          description: input.description,
          active: input.active,
          amountPerMonthMin: input.amountPerMonthMin,
          availablePaymentMethods: input.availablePaymentMethods
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID, ...memberPlan} = value
    return {id: outID, ...memberPlan}
  }

  async deleteMemberPlan({id}: DeleteMemberPlanArgs): Promise<string | null> {
    const {deletedCount} = await this.memberPlans.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getMemberPlansByID(ids: readonly string[]): Promise<OptionalMemberPlan[]> {
    const memberPlans = await this.memberPlans.find({_id: {$in: ids}}).toArray()
    const memberPlanMap = Object.fromEntries(
      memberPlans.map(({_id: id, ...memberPlan}) => [id, {id, ...memberPlan}])
    )

    return ids.map(id => memberPlanMap[id] ?? null)
  }

  async getMemberPlansBySlug(slugs: string[]): Promise<OptionalMemberPlan[]> {
    const memberPlans = await this.memberPlans.find({slug: {$in: slugs}}).toArray()
    const memberPlansMap = Object.fromEntries(
      memberPlans.map(({_id: id, slug, ...memberPlan}) => [slug, {id, slug, ...memberPlan}])
    )

    return slugs.map(slug => memberPlansMap[slug] ?? null)
  }

  async getMemberPlans({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>> {
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

    const sortField = memberPlanSortFieldForSort(sort)
    const cursorFilter = cursorData
      ? {
          $or: [
            {[sortField]: {[expr]: cursorData.date}},
            {_id: {[expr]: cursorData.id}, [sortField]: cursorData.date}
          ]
        }
      : {}

    const textFilter: FilterQuery<any> = {}
    if (filter && JSON.stringify(filter) !== '{}') {
      textFilter.$and = []
    }

    // TODO: Rename to search
    if (filter?.name !== undefined) {
      textFilter.$and?.push({name: {$regex: escapeRegExp(filter.name), $options: 'i'}})
    }

    if (filter?.active !== undefined) {
      textFilter.$and?.push({active: filter.active})
    }

    if (filter?.tags) {
      // regex ?
      textFilter.$and?.push({tags: filter.tags})
    }

    const [totalCount, memberPlans] = await Promise.all([
      this.memberPlans.countDocuments(textFilter, {
        collation: {locale: this.locale, strength: 2}
      } as MongoCountPreferences), // MongoCountPreferences doesn't include collation

      this.memberPlans
        .aggregate([], {collation: {locale: this.locale, strength: 2}})
        .match(textFilter)
        .match(cursorFilter)
        .sort({[sortField]: sortDirection, _id: sortDirection})
        .limit(limitCount + 1)
        .toArray()
    ])

    const nodes = memberPlans.slice(0, limitCount)

    if (limit.type === LimitType.Last) {
      nodes.reverse()
    }

    const hasNextPage =
      limit.type === LimitType.First
        ? memberPlans.length > limitCount
        : cursor.type === InputCursorType.Before

    const hasPreviousPage =
      limit.type === LimitType.Last
        ? memberPlans.length > limitCount
        : cursor.type === InputCursorType.After

    const firstMemberPlan = nodes[0]
    const lastMemberPlan = nodes[nodes.length - 1]

    const startCursor = firstMemberPlan
      ? new Cursor(firstMemberPlan._id, memberPlanDateForSort(firstMemberPlan, sort)).toString()
      : null

    const endCursor = lastMemberPlan
      ? new Cursor(lastMemberPlan._id, memberPlanDateForSort(lastMemberPlan, sort)).toString()
      : null

    return {
      nodes: nodes.map<MemberPlan>(({_id: id, ...memberPlan}) => ({id, ...memberPlan})),

      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage
      },

      totalCount
    }
  }

  async getActiveMemberPlansByID(ids: readonly string[]): Promise<OptionalMemberPlan[]> {
    const memberPlans = await this.memberPlans.find({_id: {$in: ids}, active: true}).toArray()
    const memberPlansMap = Object.fromEntries(
      memberPlans.map(({_id: id, ...memberPlan}) => [id, {id, ...memberPlan}])
    )

    return ids.map(id => memberPlansMap[id] ?? null)
  }

  async getActiveMemberPlansBySlug(slugs: string[]): Promise<OptionalMemberPlan[]> {
    const memberPlans = await this.memberPlans.find({slug: {$in: slugs}, active: true}).toArray()
    const memberPlansMap = Object.fromEntries(
      memberPlans.map(({_id: id, slug, ...memberPlan}) => [slug, {id, slug, ...memberPlan}])
    )

    return slugs.map(slug => memberPlansMap[slug] ?? null)
  }

  async getActiveMemberPlans({
    filter,
    sort,
    order,
    cursor,
    limit
  }: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>> {
    const {nodes, pageInfo, totalCount} = await this.getMemberPlans({
      filter: {...filter, active: true},
      sort,
      order,
      cursor,
      limit
    })

    return {
      nodes,
      pageInfo,
      totalCount
    }
  }
}

function memberPlanSortFieldForSort(sort: MemberPlanSort) {
  switch (sort) {
    case MemberPlanSort.CreatedAt:
      return 'createdAt'

    case MemberPlanSort.ModifiedAt:
      return 'modifiedAt'
  }
}

function memberPlanDateForSort(memberPlan: DBMemberPlan, sort: MemberPlanSort): Date {
  switch (sort) {
    case MemberPlanSort.CreatedAt:
      return memberPlan.createdAt

    case MemberPlanSort.ModifiedAt:
      return memberPlan.modifiedAt
  }
}
