import {Type} from '@nestjs/common'
import {ArgsType, Field, Int, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class PageInfo {
  @Field()
  hasPreviousPage!: boolean

  @Field()
  hasNextPage!: boolean

  @Field({nullable: true})
  startCursor?: string

  @Field({nullable: true})
  endCursor?: string
}

export interface PaginatedObjectType<T> {
  nodes: T[]
  totalCount: number
  pageInfo: PageInfo
}

export function PaginatedType<T>(classRef: Type<T>): Type<PaginatedObjectType<T>> {
  @ObjectType()
  class PaginatedObjectTypeImpl implements PaginatedObjectType<T> {
    @Field(type => [classRef])
    nodes!: T[]

    @Field(() => Int)
    totalCount!: number

    @Field(type => PageInfo)
    pageInfo!: PageInfo
  }

  return PaginatedObjectTypeImpl
}

@ArgsType()
export class PaginatedArgsType {
  @Field(type => Int, {nullable: true, defaultValue: 10})
  take: 10

  @Field(type => Int, {nullable: true, defaultValue: 0})
  skip?: number

  @Field({nullable: true})
  cursorId?: string
}
