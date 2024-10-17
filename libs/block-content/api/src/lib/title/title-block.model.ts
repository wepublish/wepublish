import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class TitleBlock extends BaseBlock<typeof BlockType.Title> {
  @Field({nullable: true})
  title?: string

  @Field({nullable: true})
  lead?: string
}
