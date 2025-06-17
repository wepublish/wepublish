import {Directive, Field, InputType, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaginatedType} from '@wepublish/utils/api'

export enum MemberPlanSort {
  createdAt = 'createdAt',
  modifiedAt = 'modifiedAt'
}

registerEnumType(MemberPlanSort, {
  name: 'MemberPlanSort'
})

enum Currency {
  CHF = 'CHF',
  EUR = 'EUR'
}

registerEnumType(Currency, {
  name: 'Currency'
})

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class MemberPlan {
  @Field()
  @Directive('@external')
  id!: string
}

@ObjectType()
export class MemberPlanConnection extends PaginatedType(MemberPlan) {}

@InputType()
export class MemberPlanFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  active?: boolean

  @Field(() => [String], {nullable: true})
  tags?: string[]
}
