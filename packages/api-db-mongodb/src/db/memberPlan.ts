import {
  CreateMemberPlanArgs,
  DBMemberPlanAdapter,
  MemberPlan,
  OptionalMemberPlan,
  UpdateMemberPlanArgs
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {CollectionName, DBMemberPlan} from './schema'

export class MongoDBMemberPlanAdapter implements DBMemberPlanAdapter {
  private memberPlans: Collection<DBMemberPlan>

  constructor(db: Db) {
    this.memberPlans = db.collection(CollectionName.MemberPlans)
  }

  async createMemberPlan({input}: CreateMemberPlanArgs): Promise<MemberPlan> {
    const {ops} = await this.memberPlans.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      slug: input.slug,
      tags: input.tags ? input.tags : [],
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
}
