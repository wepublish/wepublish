import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class BildwurfAdBlock extends BaseBlock<typeof BlockType.BildwurfAd> {
  @Field({nullable: true})
  zoneID?: string
}
