import {Field, Int, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class IFrameBlock extends BaseBlock<typeof BlockType.Embed> {
  @Field({nullable: true})
  url?: string
  @Field({nullable: true})
  title?: string

  @Field(() => Int, {nullable: true})
  width?: number
  @Field(() => Int, {nullable: true})
  height?: number

  @Field({nullable: true})
  styleCustom?: string
  @Field({nullable: true})
  sandbox?: string
}
