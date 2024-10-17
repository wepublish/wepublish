import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class HTMLBlock extends BaseBlock<typeof BlockType.HTML> {
  @Field({nullable: true})
  html?: string
}
