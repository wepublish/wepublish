import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field()
  hasPreviousPage!: boolean;

  @Field()
  hasNextPage!: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

export interface PaginatedObjectType<T> {
  nodes: T[];
  totalCount: number;
  pageInfo: PageInfo;
}

export function PaginatedType<T>(
  classRef: Type<T>
): Type<PaginatedObjectType<T>> {
  @ObjectType()
  class PaginatedObjectTypeImpl implements PaginatedObjectType<T> {
    @Field(type => [classRef])
    nodes!: T[];

    @Field(() => Int)
    totalCount!: number;

    @Field(type => PageInfo)
    pageInfo!: PageInfo;
  }

  return PaginatedObjectTypeImpl;
}
