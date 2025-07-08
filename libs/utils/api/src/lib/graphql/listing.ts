import {ArgsType, Field} from '@nestjs/graphql'
import {PaginatedArgsType} from './paginated-type'
import {SortOrder} from './sort-order'

@ArgsType()
export abstract class ListingArgsType extends PaginatedArgsType {
  @Field(() => SortOrder, {nullable: true})
  order?: SortOrder

  abstract sort?: any
}
