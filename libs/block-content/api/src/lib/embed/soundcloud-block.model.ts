import {Field, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'

@ObjectType({
  implements: BaseBlock
})
export class SoundCloudTrackBlock extends BaseBlock<typeof BlockType.SoundCloudTrack> {
  @Field({nullable: true})
  trackID?: string
}
