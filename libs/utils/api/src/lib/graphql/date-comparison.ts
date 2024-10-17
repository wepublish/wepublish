import {Field, InputType, registerEnumType} from '@nestjs/graphql'
import {Prisma} from '@prisma/client'

export enum DateFilterComparison {
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  Equal = 'eq',
  LowerThan = 'lt',
  LowerThanOrEqual = 'lte'
}

registerEnumType(DateFilterComparison, {
  name: 'DateFilterComparison'
})

@InputType()
export class DateFilter {
  @Field({nullable: true})
  date?: Date
  @Field(() => DateFilterComparison)
  comparison!: DateFilterComparison
}

export const mapDateFilterToPrisma = (
  comparison: DateFilterComparison
): keyof Prisma.DateTimeFilter => {
  return comparison === DateFilterComparison.Equal ? 'equals' : comparison
}
