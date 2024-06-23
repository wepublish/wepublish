import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BlockType} from '../block-type'

@ObjectType()
export class SoundCloudTrackBlock {
  @Field()
  type: BlockType = BlockType.SoundCloudTrack

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  trackID!: string
}

@InputType()
export class SoundCloudTrackBlockInput extends OmitType(SoundCloudTrackBlock, [], InputType) {}
